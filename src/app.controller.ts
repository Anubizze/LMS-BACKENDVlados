import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
<<<<<<< HEAD
=======

  @Get('health')
  health() {
    return { ok: true, message: 'Backend works', port: process.env.PORT ?? 3001 };
  }
>>>>>>> df9041c (LMS backend)
}
