import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WatchlistService } from './watchlist.service';
import { AddWatchlistDto } from './dto/watchlist.dto';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private watchlist: WatchlistService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.watchlist.findAll(user.id);
  }

  @Post()
  add(@CurrentUser() user: { id: string }, @Body() dto: AddWatchlistDto) {
    return this.watchlist.add(user.id, dto);
  }

  @Delete(':symbol')
  remove(@CurrentUser() user: { id: string }, @Param('symbol') symbol: string) {
    return this.watchlist.remove(user.id, symbol);
  }
}
