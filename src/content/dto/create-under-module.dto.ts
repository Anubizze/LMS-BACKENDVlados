import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const ASSIGNMENT_TYPES = ['introduction', 'theory', 'video', 'practice', 'test'] as const;

export class CreateUnderModuleDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsIn(ASSIGNMENT_TYPES)
  type?: typeof ASSIGNMENT_TYPES[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  maxScore?: number;
}
