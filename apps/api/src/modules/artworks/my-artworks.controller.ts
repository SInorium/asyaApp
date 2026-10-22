import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { CurrentUser, Roles, type AuthUser } from '../../common/auth.decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { StorageService } from '../storage/storage.service';
import {
  ArtworkDto,
  ArtworkStatusUpdateDto,
  ArtworkUpsertDto,
  AttachImageDto,
  MyArtworksQueryDto,
  PresignDto,
  PresignResponseDto,
  ReorderImagesDto,
} from './artworks.dto';
import { ArtworksService } from './artworks.service';

@ApiTags('my-artworks')
@Controller('me/artworks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'AUTHOR')
export class MyArtworksController {
  constructor(
    private readonly artworks: ArtworksService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @ZodResponse({ status: 200, type: [ArtworkDto] })
  list(@CurrentUser() user: AuthUser, @Query() query: MyArtworksQueryDto) {
    return this.artworks.listMine(user, query.status);
  }

  @Get(':id')
  @ZodResponse({ status: 200, type: ArtworkDto })
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.artworks.getMine(user, id);
  }

  @Post()
  @ZodResponse({ status: 201, type: ArtworkDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: ArtworkUpsertDto) {
    return this.artworks.create(user, dto);
  }

  @Put(':id')
  @ZodResponse({ status: 200, type: ArtworkDto })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ArtworkUpsertDto) {
    return this.artworks.update(user, id, dto);
  }

  @Patch(':id/status')
  @ZodResponse({ status: 200, type: ArtworkDto })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ArtworkStatusUpdateDto,
  ) {
    return this.artworks.updateStatus(user, id, dto.status);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.artworks.remove(user, id);
  }

  // ---------- изображения ----------

  @Post('uploads/presign')
  @ZodResponse({ status: 201, type: PresignResponseDto })
  presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDto) {
    return this.storage.presignUpload(user.id, dto.contentType);
  }

  @Post(':id/images')
  @ZodResponse({ status: 201, type: ArtworkDto })
  attachImage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AttachImageDto) {
    return this.artworks.attachImage(user, id, dto.key);
  }

  @Put(':id/images/order')
  @ZodResponse({ status: 200, type: ArtworkDto })
  reorderImages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.artworks.reorderImages(user, id, dto.imageIds, dto.coverId);
  }

  @Delete(':id/images/:imageId')
  @ZodResponse({ status: 200, type: ArtworkDto })
  removeImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.artworks.removeImage(user, id, imageId);
  }
}
