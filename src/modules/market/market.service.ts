import { Injectable } from '@nestjs/common';
import { BinanceWsService } from '../../services/binance-ws.service';

@Injectable()
export class MarketService {
  constructor(private binanceWs: BinanceWsService) {}

  getTicker(symbol: string) {
    return this.binanceWs.getTicker(symbol.toUpperCase());
  }

  getAllTickers() {
    return this.binanceWs.getAllTickers();
  }
}
