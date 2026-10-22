import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Roles, type AuthUser } from '../../common/auth.decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  InquiryCreateDto,
  InquiryDto,
  InquiryStatusUpdateDto,
  MyInquiriesQueryDto,
} from './inquiries.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('inquiries')
@Controller()
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  /** Публичная форма «Оставить заявку»: не больше 5 заявок в минуту с одного IP. */
  @Post('artworks/:id/inquiries')
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(@Param('id') artworkId: string, @Body() dto: InquiryCreateDto) {
    await this.inquiries.create(artworkId, dto);
  }

  @Get('me/inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'AUTHOR')
  @ZodResponse({ status: 200, type: [InquiryDto] })
  list(@CurrentUser() user: AuthUser, @Query() query: MyInquiriesQueryDto) {
    return this.inquiries.listMine(user, query.status);
  }

  @Patch('me/inquiries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'AUTHOR')
  @ZodResponse({ status: 200, type: InquiryDto })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: InquiryStatusUpdateDto,
  ) {
    return this.inquiries.updateStatus(user, id, dto.status);
  }
}
