import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
