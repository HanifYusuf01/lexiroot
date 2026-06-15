import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AcceptAdminInvitationDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'Password must include 1 capital letter' })
  @Matches(/[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~;']/, {
    message: 'Password must include 1 symbol',
  })
  password!: string;
}
