import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IsString, IsNumber, IsPositive } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PortfolioService } from './portfolio.service';
import { CreateTradeDto } from './dto/trade.dto';

class DepositDto {
  @IsString() asset: string;
  @IsNumber() @IsPositive() amount: number;
}

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private portfolio: PortfolioService) {}

  @Get()
  findPortfolio(@CurrentUser() user: { id: string }) {
    return this.portfolio.findPortfolio(user.id);
  }

  @Get('trades')
  findTrades(@CurrentUser() user: { id: string }) {
    return this.portfolio.findTrades(user.id);
  }

  @Post('trade')
  executeTrade(@CurrentUser() user: { id: string }, @Body() dto: CreateTradeDto) {
    return this.portfolio.executeTrade(user.id, dto);
  }

  @Post('deposit')
  deposit(@CurrentUser() user: { id: string }, @Body() dto: DepositDto) {
    return this.portfolio.deposit(user.id, dto.asset, dto.amount);
  }
}
