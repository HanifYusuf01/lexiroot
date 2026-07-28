import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyAppleTransactionDto {
  // transactionId (or originalTransactionId) from the StoreKit purchase result,
  // obtained on the client via expo-iap.
  @IsString()
  @IsNotEmpty()
  transactionId!: string;
}
