import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subject } from 'rxjs';
import WebSocket from 'ws';

export interface TickerData {
  symbol: string;
  price: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  quoteVolume: string;
}

interface BinanceMiniTicker {
  e: string;
  E: number;
  s: string;
  c: string;
  o: string;
  h: string;
  l: string;
  v: string;
  q: string;
}

@Injectable()
export class BinanceWsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceWsService.name);
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly tickers = new Map<string, TickerData>();

  readonly ticker$ = new Subject<TickerData>();

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.reconnectTimer && clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ticker$.complete();
  }

  getTicker(symbol: string): TickerData | undefined {
    return this.tickers.get(symbol);
  }

  getAllTickers(): TickerData[] {
    return Array.from(this.tickers.values());
  }

  private connect() {
    const baseUrl = this.config.get<string>('binance.wsUrl');
    const ws = new WebSocket(`${baseUrl}/ws/!miniTicker@arr`);
    this.ws = ws;

    ws.on('open', () => this.logger.log('Binance WS connected'));
    ws.on('message', (raw: Buffer) => this.handleMessage(raw));
    ws.on('error', (err) => this.logger.error('Binance WS error', err.message));
    ws.on('close', () => {
      this.logger.warn('Binance WS closed — reconnecting in 5s');
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    });
  }

  private handleMessage(raw: Buffer) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const items: BinanceMiniTicker[] = JSON.parse(raw.toString());
      for (const t of items) {
        const ticker: TickerData = {
          symbol: t.s,
          price: t.c,
          open: t.o,
          high: t.h,
          low: t.l,
          volume: t.v,
          quoteVolume: t.q,
        };
        this.tickers.set(t.s, ticker);
        this.ticker$.next(ticker);
      }
    } catch (e) {
      this.logger.error('Failed to parse Binance message', e);
    }
  }
}
