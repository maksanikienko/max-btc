import { IsString, IsUppercase, Length } from 'class-validator';

export class AddWatchlistDto {
  @IsString()
  @IsUppercase()
  @Length(2, 20)
  symbol: string;
}
