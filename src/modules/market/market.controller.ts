import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MarketService } from './market.service';

@Controller('market')
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(private market: MarketService) {}

  @Get('tickers')
  getAllTickers() {
    return this.market.getAllTickers();
  }

  @Get('ticker/:symbol')
  getTicker(@Param('symbol') symbol: string) {
    return this.market.getTicker(symbol);
  }
}
