import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ServicesModule } from './services/services.module';
import { GatewaysModule } from './gateways/gateways.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MarketModule } from './modules/market/market.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { AlertModule } from './modules/alert/alert.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { RoomModule } from './modules/room/room.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ServicesModule,
    GatewaysModule,
    AuthModule,
    UserModule,
    MarketModule,
    WatchlistModule,
    AlertModule,
    PortfolioModule,
    RoomModule,
    NotificationModule,
  ],
})
export class AppModule {}
