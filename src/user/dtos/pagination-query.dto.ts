import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Min(1)
  @IsInt()
  page: number = 1;

  @IsOptional()
  @Max(100)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
