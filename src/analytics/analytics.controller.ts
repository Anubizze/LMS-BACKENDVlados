import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';

const TEACHER_ROLES = ['teacher', 'admin'] as const;

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...TEACHER_ROLES)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getForTeacher(@Req() req: Request) {
    return this.analyticsService.getForTeacher(req.user.id);
  }
}
