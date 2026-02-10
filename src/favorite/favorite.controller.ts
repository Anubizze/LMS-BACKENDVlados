import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { FavoriteService } from './favorite.service';

@Controller('favorite')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('course/:courseId')
  async add(@Req() req: Request, @Param('courseId', ParseIntPipe) courseId: number) {
    return this.favoriteService.add(req.user.id, courseId);
  }

  @Delete('course/:courseId')
  async remove(@Req() req: Request, @Param('courseId', ParseIntPipe) courseId: number) {
    return this.favoriteService.remove(req.user.id, courseId);
  }

  @Get('my')
  async getMyFavorites(@Req() req: Request) {
    return this.favoriteService.getMyFavorites(req.user.id);
  }

  @Get('course/:courseId/check')
  async check(@Req() req: Request, @Param('courseId', ParseIntPipe) courseId: number) {
    const isFavorite = await this.favoriteService.check(req.user.id, courseId);
    return { isFavorite };
  }
}
