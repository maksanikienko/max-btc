import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { BinanceWsService } from '../services/binance-ws.service';
import { BlockchainService, type Network } from '../modules/blockchain/blockchain.service';

@WebSocketGateway({ namespace: '/trading', cors: { origin: '*' } })
export class TradingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TradingGateway.name);

  constructor(
    private binanceWs: BinanceWsService,
    private blockchain: BlockchainService,
  ) {}

  afterInit() {
    this.binanceWs.ticker$.subscribe((ticker) => {
      this.server.to(`ticker:${ticker.symbol}`).emit('ticker', ticker);
    });
    this.logger.log('TradingGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:ticker')
  async subscribeTicker(
    @ConnectedSocket() client: Socket,
    @MessageBody() symbol: string,
  ) {
    const sym = symbol.toUpperCase();
    await client.join(`ticker:${sym}`);
    const cached = this.binanceWs.getTicker(sym);
    if (cached) client.emit('ticker', cached);
    return { subscribed: sym };
  }

  @SubscribeMessage('unsubscribe:ticker')
  async unsubscribeTicker(
    @ConnectedSocket() client: Socket,
    @MessageBody() symbol: string,
  ) {
    await client.leave(`ticker:${symbol.toUpperCase()}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await client.join(`room:${roomId}`);
    client
      .to(`room:${roomId}`)
      .emit('room:userJoined', { socketId: client.id });
    return { joined: roomId };
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await client.leave(`room:${roomId}`);
    client.to(`room:${roomId}`).emit('room:userLeft', { socketId: client.id });
  }

  @SubscribeMessage('room:message')
  sendRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; message: string },
  ) {
    this.server.to(`room:${payload.roomId}`).emit('room:message', {
      from: client.id,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Client asks the backend to watch a submitted transaction.
   * The server polls the RPC until confirmed/failed and pushes tx:status
   * back to the requesting socket — other connected sessions of the same
   * user would receive the update automatically.
   */
  @SubscribeMessage('tx:watch')
  handleTxWatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { hash: string; network?: Network },
  ) {
    const network: Network = payload.network === 'mainnet' ? 'mainnet' : 'sepolia';

    this.blockchain.pollTransactionReceipt(
      payload.hash,
      network,
      (status, blockNumber) => {
        client.emit('tx:status', { hash: payload.hash, status, blockNumber });
      },
    );

    this.logger.log(`Watching tx ${payload.hash} on ${network}`);
    return { watching: payload.hash };
  }
}
