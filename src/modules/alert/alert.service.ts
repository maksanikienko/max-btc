import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { BinanceWsService } from '../../services/binance-ws.service';
import { NotificationService } from '../notification/notification.service';
import { CreateAlertDto } from './dto/alert.dto';

@Injectable()
export class AlertService {
  constructor(
    private prisma: PrismaService,
    private binanceWs: BinanceWsService,
    private notifications: NotificationService,
  ) {}

  findAll(userId: string) {
    return this.prisma.alert.findMany({ where: { userId } });
  }

  create(userId: string, dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: { userId, symbol: dto.symbol.toUpperCase(), price: dto.price, condition: dto.condition },
    });
  }

  delete(id: string, userId: string) {
    return this.prisma.alert.deleteMany({ where: { id, userId } });
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkAlerts() {
    const active = await this.prisma.alert.findMany({ where: { isActive: true } });

    for (const alert of active) {
      const ticker = this.binanceWs.getTicker(alert.symbol);
      if (!ticker) continue;

      const current = parseFloat(ticker.price);
      const target = parseFloat(alert.price.toString());
      const triggered =
        (alert.condition === 'ABOVE' && current >= target) ||
        (alert.condition === 'BELOW' && current <= target);

      if (!triggered) continue;

      await Promise.all([
        this.prisma.alert.update({
          where: { id: alert.id },
          data: { isActive: false, triggeredAt: new Date() },
        }),
        this.notifications.create(alert.userId, {
          type: 'ALERT',
          title: `Price Alert: ${alert.symbol}`,
          body: `${alert.symbol} hit ${target} — now at ${current}`,
        }),
      ]);
    }
  }
}
