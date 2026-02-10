import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
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
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

const COVERS_UPLOAD_DIR = join(process.cwd(), 'uploads', 'covers');
if (!existsSync(COVERS_UPLOAD_DIR)) mkdirSync(COVERS_UPLOAD_DIR, { recursive: true });

const TEACHER_ROLES = ['teacher', 'admin'] as const;

@Controller('course')
export class CourseController {
  private readonly logger = new Logger(CourseController.name);

  constructor(private readonly courseService: CourseService) {}

  @Get()
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('level') level?: string,
  ) {
    const filters: { categoryId?: number; level?: string } = {};
    if (categoryId) filters.categoryId = parseInt(categoryId, 10);
    if (level) filters.level = level;
    return this.courseService.findAll(filters);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async findMyCourses(@Req() req: Request) {
    return this.courseService.findMyCourses(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async create(@Req() req: Request, @Body() dto: CreateCourseDto) {
    return this.courseService.create(req.user.id, dto);
  }

  @Post('upload/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: COVERS_UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const safeExt = (extname(file.originalname || '') || '.jpg').slice(0, 10);
          const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
          cb(null, name);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file?.mimetype?.startsWith('image/')) {
          return cb(new BadRequestException('Можно загружать только изображения'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadCover(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не получен');
    return { path: `/uploads/covers/${file.filename}` };
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      const course = await this.courseService.findById(id);
      if (!course) throw new NotFoundException('Курс не найден');
      return course;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`findById(${id}) failed: ${err?.message ?? err}`, err?.stack);
      throw new InternalServerErrorException('Ошибка при загрузке курса');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courseService.update(req.user.id, id, dto, req.user.role);
  }

  @Delete('permanent/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.courseService.remove(req.user.id, id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...TEACHER_ROLES)
  async archive(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.courseService.archive(req.user.id, id, req.user.role);
  }
}
