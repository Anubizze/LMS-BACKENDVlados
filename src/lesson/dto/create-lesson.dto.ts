import { IsInt, IsOptional, IsString, IsIn, MaxLength, Min } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  @IsIn(['theory', 'practice', 'test', 'video'])
  type?: string;
}
