import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('course/:courseId')
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: Request,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(req.user.id, courseId, dto.rating, dto.comment);
  }

  @Get('course/:courseId')
  async getByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.reviewService.getByCourse(courseId);
  }

  @Get('course/:courseId/my')
  @UseGuards(JwtAuthGuard)
  async getMyReview(@Req() req: Request, @Param('courseId', ParseIntPipe) courseId: number) {
    const review = await this.reviewService.getMyReview(req.user.id, courseId);
    return { review };
  }
}
