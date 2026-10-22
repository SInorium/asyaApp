import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ArtworkStatus, ArtworkUpsertSchema, CatalogQuery, Paginated, Artwork } from '@asya/shared';
import type { z } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import type { AuthUser } from '../../common/auth.decorators';
import { uniqueSlug } from '../../common/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { RevalidationService } from '../integrations/revalidation.service';
import { StorageService } from '../storage/storage.service';
import { artworkInclude, toArtwork } from './artworks.mapper';

type UpsertData = z.output<typeof ArtworkUpsertSchema>;

const PUBLIC_STATUSES: ArtworkStatus[] = ['PUBLISHED', 'RESERVED', 'SOLD'];
export const CATALOG_TAG = 'artworks';

@Injectable()
export class ArtworksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ---------- публичная часть ----------

  async listPublic(q: CatalogQuery): Promise<Paginated<Artwork>> {
    const where: Prisma.ArtworkWhereInput = {
      status: q.status ? q.status : { in: PUBLIC_STATUSES },
      type: q.type,
      price: { gte: q.priceMin, lte: q.priceMax },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.artwork.findMany({
        where,
        include: artworkInclude,
        // сначала то, что можно купить, потом проданное
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.artwork.count({ where }),
    ]);
    return {
      items: items.map((a) => toArtwork(a, this.storage)),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  async getPublicBySlug(slug: string): Promise<Artwork> {
    const artwork = await this.prisma.artwork.findFirst({
      where: { slug, status: { in: PUBLIC_STATUSES } },
      include: artworkInclude,
    });
    if (!artwork) throw new NotFoundException();
    return toArtwork(artwork, this.storage);
  }

  // ---------- кабинет автора ----------

  async listMine(user: AuthUser, status?: ArtworkStatus): Promise<Artwork[]> {
    const items = await this.prisma.artwork.findMany({
      where: { ...this.ownerFilter(user), status },
      include: artworkInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return items.map((a) => toArtwork(a, this.storage));
  }

  async getMine(user: AuthUser, id: string): Promise<Artwork> {
    return toArtwork(await this.findOwned(user, id), this.storage);
  }

  async create(user: AuthUser, data: UpsertData): Promise<Artwork> {
    const profile = await this.prisma.authorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ForbiddenException('У пользователя нет профиля автора');

    const artwork = await this.prisma.artwork.create({
      data: { ...data, slug: uniqueSlug(data.title), authorId: profile.id },
      include: artworkInclude,
    });
    this.touchCatalog(artwork.status);
    return toArtwork(artwork, this.storage);
  }

  async update(user: AuthUser, id: string, data: UpsertData): Promise<Artwork> {
    const before = await this.findOwned(user, id);
    const artwork = await this.prisma.artwork.update({
      where: { id },
      data,
      include: artworkInclude,
    });
    this.touchCatalog(before.status, artwork.status);
    return toArtwork(artwork, this.storage);
  }

  async updateStatus(user: AuthUser, id: string, status: ArtworkStatus): Promise<Artwork> {
    const before = await this.findOwned(user, id);
    const artwork = await this.prisma.artwork.update({
      where: { id },
      data: { status },
      include: artworkInclude,
    });
    this.touchCatalog(before.status, status);
    return toArtwork(artwork, this.storage);
  }

  async remove(user: AuthUser, id: string) {
    const artwork = await this.findOwned(user, id);
    await this.prisma.artwork.delete({ where: { id } });
    await Promise.all(artwork.images.map((img) => this.storage.delete(img.s3Key)));
    this.touchCatalog(artwork.status);
  }

  // ---------- изображения ----------

  async attachImage(user: AuthUser, id: string, key: string): Promise<Artwork> {
    if (!this.storage.isOwnedKey(user.id, key)) throw new BadRequestException('Чужой файл');
    const artwork = await this.findOwned(user, id);
    await this.prisma.artworkImage.create({
      data: {
        artworkId: id,
        s3Key: key,
        position: artwork.images.length,
        isCover: artwork.images.length === 0,
      },
    });
    this.touchCatalog(artwork.status);
    return this.getMine(user, id);
  }

  async removeImage(user: AuthUser, id: string, imageId: string): Promise<Artwork> {
    const artwork = await this.findOwned(user, id);
    const image = artwork.images.find((img) => img.id === imageId);
    if (!image) throw new NotFoundException();

    await this.prisma.artworkImage.delete({ where: { id: imageId } });
    const rest = artwork.images.filter((img) => img.id !== imageId);
    // если удалили обложку — обложкой становится первая оставшаяся
    await this.saveOrder(rest.map((i) => i.id), image.isCover ? rest[0]?.id : undefined);
    await this.storage.delete(image.s3Key);
    this.touchCatalog(artwork.status);
    return this.getMine(user, id);
  }

  async reorderImages(user: AuthUser, id: string, imageIds: string[], coverId?: string) {
    const artwork = await this.findOwned(user, id);
    const known = new Set(artwork.images.map((i) => i.id));
    if (imageIds.length !== known.size || !imageIds.every((i) => known.has(i))) {
      throw new BadRequestException('Список изображений не совпадает');
    }
    await this.saveOrder(imageIds, coverId);
    this.touchCatalog(artwork.status);
    return this.getMine(user, id);
  }

  // ---------- helpers ----------

  private async saveOrder(imageIds: string[], coverId?: string) {
    await this.prisma.$transaction(
      imageIds.map((imageId, position) =>
        this.prisma.artworkImage.update({
          where: { id: imageId },
          data: coverId ? { position, isCover: imageId === coverId } : { position },
        }),
      ),
    );
  }

  /** OWNER управляет всем магазином, AUTHOR — только своими работами. */
  private ownerFilter(user: AuthUser): Prisma.ArtworkWhereInput {
    return user.role === 'OWNER' ? {} : { author: { userId: user.id } };
  }

  private async findOwned(user: AuthUser, id: string) {
    const artwork = await this.prisma.artwork.findFirst({
      where: { id, ...this.ownerFilter(user) },
      include: artworkInclude,
    });
    if (!artwork) throw new NotFoundException();
    return artwork;
  }

  /** Черновики на сайте не видны, поэтому их правки не сбрасывают кэш. */
  private touchCatalog(...statuses: ArtworkStatus[]) {
    if (statuses.some((s) => s !== 'DRAFT')) this.revalidation.revalidate([CATALOG_TAG]);
  }
}
