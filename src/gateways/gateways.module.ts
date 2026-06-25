import { Module } from '@nestjs/common';
import { TradingGateway } from './trading.gateway';
import { BlockchainModule } from '../modules/blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  providers: [TradingGateway],
})
export class GatewaysModule {}
