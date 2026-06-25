import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { PrismaService } from '../../database/prisma.service';

export type Network = 'mainnet' | 'sepolia';
export type TxStatus = 'pending' | 'confirmed' | 'failed';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── Signature verification ───────────────────────────────────────────────

  verifySignature(message: string, signature: string, expectedAddress: string): boolean {
    try {
      const recovered = ethers.verifyMessage(message, signature);
      return recovered.toLowerCase() === expectedAddress.toLowerCase();
    } catch {
      return false;
    }
  }

  // ─── Wallet linking ───────────────────────────────────────────────────────

  async linkWallet(userId: string, address: string, signature: string): Promise<void> {
    const message = `Link wallet ${address} to MAX·BTC account`;

    if (!this.verifySignature(message, signature, address)) {
      throw new BadRequestException('Invalid signature — cannot verify wallet ownership');
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletAddress: address.toLowerCase() },
      });
    } catch {
      // Unique constraint violation — another account already owns this wallet
      throw new BadRequestException('This wallet is already linked to another account');
    }
  }

  async unlinkWallet(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { walletAddress: null },
    });
  }

  async getLinkedWallet(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });
    return user?.walletAddress ?? null;
  }

  // ─── Transaction polling (used by TradingGateway for socket tx:watch) ─────

  getProvider(network: Network): ethers.JsonRpcProvider {
    const url =
      network === 'mainnet'
        ? this.config.get<string>('ethereum.rpcUrl')!
        : this.config.get<string>('ethereum.sepoliaRpcUrl')!;
    return new ethers.JsonRpcProvider(url);
  }

  async pollTransactionReceipt(
    txHash: string,
    network: Network,
    onStatus: (status: TxStatus, blockNumber?: number) => void,
  ): Promise<void> {
    const provider = this.getProvider(network);
    let attempts = 0;
    const MAX = 72; // 72 × 5 s = 6 min

    const check = async () => {
      if (attempts >= MAX) {
        onStatus('failed');
        return;
      }
      attempts++;

      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          const status: TxStatus = receipt.status === 1 ? 'confirmed' : 'failed';
          onStatus(status, receipt.blockNumber);
          return;
        }
      } catch (err) {
        this.logger.debug(`Receipt not ready for ${txHash}: ${err}`);
      }

      setTimeout(check, 5000);
    };

    setTimeout(check, 4000);
  }
}
