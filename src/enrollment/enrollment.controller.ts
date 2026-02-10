import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollment')
@UseGuards(JwtAuthGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post('course/:courseId')
  async enroll(@Req() req: Request, @Param('courseId', ParseIntPipe) courseId: number) {
    return this.enrollmentService.enroll(req.user.id, courseId);
  }

  @Get('my')
  async getMyEnrollments(@Req() req: Request) {
    return this.enrollmentService.getMyEnrollments(req.user.id);
  }

  @Put('course/:courseId/progress')
  async updateProgress(
    @Req() req: Request,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.enrollmentService.updateProgress(req.user.id, courseId, dto.progressPercent);
  }

  @Get('course/:courseId/check')
  async checkEnrollment(@Req() req: Request, @Param('courseId', ParseIntPipe) courseId: number) {
    const enrolled = await this.enrollmentService.checkEnrollment(req.user.id, courseId);
    return { enrolled };
  }
}
