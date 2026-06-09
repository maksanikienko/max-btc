import { IsString, IsNumber, IsEnum, IsPositive } from 'class-validator';
import { TradeType } from '@prisma/client';

export class CreateTradeDto {
  @IsString()
  symbol: string;

  @IsEnum(TradeType)
  type: TradeType;

  @IsNumber()
  @IsPositive()
  amount: number;
}
