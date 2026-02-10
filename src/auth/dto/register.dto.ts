// src/auth/dto/register.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
<<<<<<< HEAD
=======
  IsOptional,
>>>>>>> df9041c (LMS backend)
  IsString,
  MinLength,
} from 'class-validator'
import { ROLES } from 'shared/constants/roles'
import type { Role } from 'shared/type/type.role'

<<<<<<< HEAD


=======
>>>>>>> df9041c (LMS backend)
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullname: string

  @IsEmail()
  email: string

  @IsString()
<<<<<<< HEAD
  @MinLength(8)
  password: string

  @IsEnum(ROLES)
  role: Role
=======
  @MinLength(8, { message: 'Пароль должен быть не менее 8 символов' })
  password: string

  @IsOptional()
  @IsEnum(ROLES)
  role?: Role
>>>>>>> df9041c (LMS backend)
}
