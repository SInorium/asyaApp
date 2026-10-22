import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Inquiry, InquiryCreateSchema, InquiryStatus } from '@asya/shared';
import type { z } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import type { AuthUser } from '../../common/auth.decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../integrations/notification.service';

const inquiryInclude = {
  artwork: { select: { id: true, slug: true, title: true } },
} satisfies Prisma.InquiryInclude;

type InquiryWithArtwork = Prisma.InquiryGetPayload<{ include: typeof inquiryInclude }>;

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async create(artworkId: string, data: z.output<typeof InquiryCreateSchema>) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
      include: { author: true },
    });
    if (!artwork || artwork.status === 'DRAFT') throw new NotFoundException();
    if (artwork.status === 'SOLD') throw new BadRequestException('Работа уже продана');

    const { website: _honeypot, ...fields } = data;
    await this.prisma.inquiry.create({ data: { ...fields, artworkId } });
    await this.notifications.newInquiry({
      authorUserId: artwork.author.userId,
      artworkTitle: artwork.title,
      customerName: fields.name,
      customerEmail: fields.email,
    });
  }

  async listMine(user: AuthUser, status?: InquiryStatus): Promise<Inquiry[]> {
    const items = await this.prisma.inquiry.findMany({
      where: { ...this.ownerFilter(user), status },
      include: inquiryInclude,
      orderBy: { createdAt: 'desc' },
    });
    return items.map(toInquiry);
  }

  async updateStatus(user: AuthUser, id: string, status: InquiryStatus): Promise<Inquiry> {
    const found = await this.prisma.inquiry.findFirst({ where: { id, ...this.ownerFilter(user) } });
    if (!found) throw new NotFoundException();
    return toInquiry(
      await this.prisma.inquiry.update({ where: { id }, data: { status }, include: inquiryInclude }),
    );
  }

  private ownerFilter(user: AuthUser): Prisma.InquiryWhereInput {
    return user.role === 'OWNER' ? {} : { artwork: { author: { userId: user.id } } };
  }
}

function toInquiry(i: InquiryWithArtwork): Inquiry {
  return {
    id: i.id,
    name: i.name,
    email: i.email,
    phone: i.phone,
    message: i.message,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
    artwork: i.artwork,
  };
}
