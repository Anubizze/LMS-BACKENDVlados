<<<<<<< HEAD
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt.guard';

=======
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';

const AVATARS_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(AVATARS_UPLOAD_DIR)) mkdirSync(AVATARS_UPLOAD_DIR, { recursive: true });

>>>>>>> df9041c (LMS backend)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
<<<<<<< HEAD
  async register(@Body() params: RegisterDto) {
    return await this.authService.register(params)
=======
  async register(
    @Body() params: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user, message } = await this.authService.register(params);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { message, user };
>>>>>>> df9041c (LMS backend)
  }

  @Post("login")
  async login(@Body()
    params:LoginDto,
    @Res({passthrough: true})
    res: Response
  ){
    const {token, user, message} = await this.authService.login(params)
    res.cookie("access_token", token,{
      httpOnly: true,      // ❗ JS не может прочитать
      secure: false,       // true если https
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return{
      message,
      user
    }
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
<<<<<<< HEAD
  me(@Req() req:Request){
    return req.user
=======
  async me(@Req() req: Request) {
    return await this.authService.getMe(req.user.id);
  }

  @Post('upload/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: AVATARS_UPLOAD_DIR,
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
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
    }),
  )
  async uploadAvatar(@Req() req: Request, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не получен');
    const path = `/uploads/avatars/${file.filename}`;
    const user = await this.authService.updateProfile(req.user.id, { avatarUrl: path });
    return { path, user };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return await this.authService.updateProfile(req.user.id, dto);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token");
    return { message: "Вы успешно вышли" };
>>>>>>> df9041c (LMS backend)
  }
}
