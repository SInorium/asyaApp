import { Module } from '@nestjs/common';
import { ArtworksController } from './artworks.controller';
import { ArtworksService } from './artworks.service';
import { MyArtworksController } from './my-artworks.controller';

@Module({
  controllers: [ArtworksController, MyArtworksController],
  providers: [ArtworksService],
  exports: [ArtworksService],
})
export class ArtworksModule {}
