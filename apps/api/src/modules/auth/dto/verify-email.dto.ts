import { IsEmail, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyEmailDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  code!: string;
}
