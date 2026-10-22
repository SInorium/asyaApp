import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ArtworkDto, ArtworkPageDto, CatalogQueryDto } from './artworks.dto';
import { ArtworksService } from './artworks.service';

@ApiTags('catalog')
@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworks: ArtworksService) {}

  @Get()
  @ZodResponse({ status: 200, type: ArtworkPageDto })
  list(@Query() query: CatalogQueryDto) {
    return this.artworks.listPublic(query);
  }

  @Get(':slug')
  @ZodResponse({ status: 200, type: ArtworkDto })
  get(@Param('slug') slug: string) {
    return this.artworks.getPublicBySlug(slug);
  }
}
