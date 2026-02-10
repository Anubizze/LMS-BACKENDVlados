import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
<<<<<<< HEAD
=======
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
>>>>>>> df9041c (LMS backend)

@Module({
  imports:[
    JwtModule.register({
      secret: process.env.SECRET_KEY || "SECRET_KEY",
      signOptions:{
        expiresIn: 7 * 24 * 60 * 60,
      }
    })
  ],
  controllers: [AuthController],
<<<<<<< HEAD
  providers: [AuthService],
  exports:[JwtModule]
=======
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports:[JwtModule, JwtAuthGuard, RolesGuard]
>>>>>>> df9041c (LMS backend)
})
export class AuthModule {}
