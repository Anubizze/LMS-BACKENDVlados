import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
