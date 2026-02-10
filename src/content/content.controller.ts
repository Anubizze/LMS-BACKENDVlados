import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ContentService } from './content.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateUnderModuleDto } from './dto/create-under-module.dto';
import { UpdateUnderModuleDto } from './dto/update-under-module.dto';
import { CreateModulesContentDto } from './dto/create-modules-content.dto';
import { UpdateModulesContentDto } from './dto/update-modules-content.dto';
import { SetScoreDto } from './dto/set-score.dto';

const TEACHER_ROLES = ['teacher', 'admin'] as const;
const VIDEO_UPLOAD_DIR = join(process.cwd(), 'uploads', 'videos');
if (!existsSync(VIDEO_UPLOAD_DIR)) mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true });

@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  // ——— Загрузка видео (преподаватель) ———
  @Post('upload/video')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: VIDEO_UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const safeExt = extname(file.originalname || '').slice(0, 10) || '.mp4';
          const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file?.mimetype?.startsWith('video/')) {
          return cb(new BadRequestException('Можно загружать только видео-файлы'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
    }),
  )
  async uploadVideo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не получен');
    return { path: `/uploads/videos/${file.filename}`, filename: file.originalname };
  }

  // ——— Модули (преподаватель) ———
  @Get('lesson/:lessonId/modules')
  async listModules(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.content.listModules(lessonId);
  }

  @Post('lesson/:lessonId/modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async createModule(
    @Req() req: Request,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: CreateModuleDto,
  ) {
    return this.content.createModule(req.user.id, lessonId, dto);
  }

  @Get('modules/:id')
  async getModule(@Param('id', ParseIntPipe) id: number) {
    return this.content.getModule(id);
  }

  @Put('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async updateModule(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.content.updateModule(req.user.id, id, dto);
  }

  @Delete('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async deleteModule(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.content.deleteModule(req.user.id, id);
  }

  // ——— Подмодули (преподаватель) ———
  @Get('module/:moduleId/under-modules')
  async listUnderModules(
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    return this.content.listUnderModules(moduleId);
  }

  @Post('module/:moduleId/under-modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async createUnderModule(
    @Req() req: Request,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() dto: CreateUnderModuleDto,
  ) {
    return this.content.createUnderModule(req.user.id, moduleId, dto);
  }

  @Get('under-modules/:id')
  async getUnderModule(@Param('id', ParseIntPipe) id: number) {
    return this.content.getUnderModule(id);
  }

  @Put('under-modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async updateUnderModule(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUnderModuleDto,
  ) {
    return this.content.updateUnderModule(req.user.id, id, dto);
  }

  @Delete('under-modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async deleteUnderModule(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.content.deleteUnderModule(req.user.id, id);
  }

  // ——— Контент подмодуля (преподаватель) ———
  @Get('under-module/:underModuleId/content')
  async listContent(
    @Param('underModuleId', ParseIntPipe) underModuleId: number,
  ) {
    return this.content.listContent(underModuleId);
  }

  @Post('under-module/:underModuleId/content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async createContent(
    @Req() req: Request,
    @Param('underModuleId', ParseIntPipe) underModuleId: number,
    @Body() dto: CreateModulesContentDto,
  ) {
    return this.content.createContent(req.user.id, underModuleId, dto);
  }

  @Get('modules-content/:id')
  async getContent(@Param('id', ParseIntPipe) id: number) {
    return this.content.getContent(id);
  }

  @Put('modules-content/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async updateContent(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModulesContentDto,
  ) {
    return this.content.updateContent(req.user.id, id, dto);
  }

  @Delete('modules-content/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async deleteContent(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.content.deleteContent(req.user.id, id);
  }

  // ——— Прохождение и доступ (студент) ———
  @Post('under-modules/:id/complete')
  @UseGuards(JwtAuthGuard)
  async markComplete(
    @Req() req: Request,
    @Param('id', ParseIntPipe) underModuleId: number,
  ) {
    return this.content.markComplete(req.user.id, underModuleId);
  }

  @Get('under-modules/:id/access')
  @UseGuards(JwtAuthGuard)
  async getAccess(
    @Req() req: Request,
    @Param('id', ParseIntPipe) underModuleId: number,
  ) {
    return this.content.getAccess(req.user.id, underModuleId);
  }

  // ——— Баллы и зачёт (≥70%) ———
  @Get('lesson/:lessonId/score')
  @UseGuards(JwtAuthGuard)
  async getLessonScore(
    @Req() req: Request,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.content.getLessonScore(req.user.id, lessonId);
  }

  @Get('lesson/:lessonId/scores-detail')
  @UseGuards(JwtAuthGuard)
  async getLessonScoresDetail(
    @Req() req: Request,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.content.getLessonScoresDetail(req.user.id, lessonId);
  }

  @Get('course/:courseId/score')
  @UseGuards(JwtAuthGuard)
  async getCourseScore(
    @Req() req: Request,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.content.getCourseScore(req.user.id, courseId);
  }

  @Put('under-modules/:id/score')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async setCompletionScore(
    @Req() req: Request,
    @Param('id', ParseIntPipe) underModuleId: number,
    @Body() dto: SetScoreDto,
  ) {
    return this.content.setCompletionScore(
      req.user.id,
      dto.studentUserId,
      underModuleId,
      dto.score,
    );
  }
}
