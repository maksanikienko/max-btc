import { IsString, IsNumber, IsEnum, IsPositive } from 'class-validator';
import { AlertCondition } from '@prisma/client';

export class CreateAlertDto {
  @IsString()
  symbol: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsEnum(AlertCondition)
  condition: AlertCondition;
}
