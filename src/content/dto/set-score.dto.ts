import { IsInt, Min } from 'class-validator';

export class SetScoreDto {
  @IsInt()
  studentUserId: number;

  @IsInt()
  @Min(0)
  score: number;
}
