import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddWatchlistDto } from './dto/watchlist.dto';

@Injectable()
export class WatchlistService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.watchlist.findMany({ where: { userId } });
  }

  async add(userId: string, dto: AddWatchlistDto) {
    try {
      return await this.prisma.watchlist.create({ data: { userId, symbol: dto.symbol } });
    } catch {
      throw new ConflictException(`${dto.symbol} is already in watchlist`);
    }
  }

  remove(userId: string, symbol: string) {
    return this.prisma.watchlist.deleteMany({ where: { userId, symbol: symbol.toUpperCase() } });
  }
}
