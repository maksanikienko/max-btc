import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BinanceWsService } from '../../services/binance-ws.service';
import { CreateTradeDto } from './dto/trade.dto';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService, private binanceWs: BinanceWsService) {}

  findPortfolio(userId: string) {
    return this.prisma.portfolio.findMany({ where: { userId } });
  }

  findTrades(userId: string) {
    return this.prisma.trade.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async executeTrade(userId: string, dto: CreateTradeDto) {
    const symbol = dto.symbol.toUpperCase();
    const ticker = this.binanceWs.getTicker(symbol);
    if (!ticker) throw new BadRequestException(`No live price for ${symbol}`);

    const price = parseFloat(ticker.price);
    const total = price * dto.amount;
    const [base, quote] = this.parseSymbol(symbol);

    return this.prisma.$transaction(async (tx) => {
      if (dto.type === 'BUY') {
        const bal = await this.getBalance(tx, userId, quote);
        if (bal < total) throw new BadRequestException('Insufficient balance');
        await this.adjustBalance(tx, userId, quote, -total);
        await this.adjustBalance(tx, userId, base, dto.amount);
      } else {
        const bal = await this.getBalance(tx, userId, base);
        if (bal < dto.amount) throw new BadRequestException('Insufficient balance');
        await this.adjustBalance(tx, userId, base, -dto.amount);
        await this.adjustBalance(tx, userId, quote, total);
      }
      return tx.trade.create({
        data: { userId, symbol, type: dto.type, price, amount: dto.amount, total },
      });
    });
  }

  deposit(userId: string, asset: string, amount: number) {
    return this.prisma.portfolio.upsert({
      where: { userId_asset: { userId, asset: asset.toUpperCase() } },
      create: { userId, asset: asset.toUpperCase(), balance: amount },
      update: { balance: { increment: amount } },
    });
  }

  private async getBalance(tx: any, userId: string, asset: string): Promise<number> {
    const row = await tx.portfolio.findUnique({ where: { userId_asset: { userId, asset } } });
    return row ? parseFloat(row.balance.toString()) : 0;
  }

  private adjustBalance(tx: any, userId: string, asset: string, delta: number) {
    return tx.portfolio.upsert({
      where: { userId_asset: { userId, asset } },
      create: { userId, asset, balance: Math.max(0, delta) },
      update: { balance: { increment: delta } },
    });
  }

  private parseSymbol(symbol: string): [string, string] {
    for (const q of ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB']) {
      if (symbol.endsWith(q)) return [symbol.slice(0, -q.length), q];
    }
    return [symbol.slice(0, -3), symbol.slice(-3)];
  }
}
