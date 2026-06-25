import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BlockchainService } from './blockchain.service';
import { LinkWalletDto } from './dto/link-wallet.dto';
import type { User } from '@prisma/client';

@Controller('blockchain')
@UseGuards(JwtAuthGuard)
export class BlockchainController {
  constructor(private blockchain: BlockchainService) {}

  /** GET /api/blockchain/wallet — returns the wallet address linked to the account */
  @Get('wallet')
  async getWallet(@CurrentUser() user: User) {
    const address = await this.blockchain.getLinkedWallet(user.id);
    return { address };
  }

  /** POST /api/blockchain/link — link a wallet by verifying a signed message */
  @Post('link')
  @HttpCode(HttpStatus.NO_CONTENT)
  async linkWallet(@CurrentUser() user: User, @Body() dto: LinkWalletDto) {
    await this.blockchain.linkWallet(user.id, dto.address, dto.signature);
  }

  /** DELETE /api/blockchain/link — remove the linked wallet from the account */
  @Delete('link')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkWallet(@CurrentUser() user: User) {
    await this.blockchain.unlinkWallet(user.id);
  }
}
