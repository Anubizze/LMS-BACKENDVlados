import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateModulesContentDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  video?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
