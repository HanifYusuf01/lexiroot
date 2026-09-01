import { IsEmail, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class InviteFamilyMemberDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;
}

export class AcceptFamilyInviteDto {
  // Tokens are 24 random bytes rendered as hex.
  @IsString()
  @Length(16, 64)
  token!: string;
}
