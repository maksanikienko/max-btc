import { Global, Module } from '@nestjs/common';
import { BinanceWsService } from './binance-ws.service';

@Global()
@Module({
  providers: [BinanceWsService],
  exports: [BinanceWsService],
})
export class ServicesModule {}
