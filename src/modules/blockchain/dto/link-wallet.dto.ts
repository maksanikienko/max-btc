import { IsString, Matches } from 'class-validator';

export class LinkWalletDto {
  @Matches(/^0x[0-9a-fA-F]{40}$/, { message: 'Invalid Ethereum address' })
  address: string;

  @IsString()
  signature: string;
}
