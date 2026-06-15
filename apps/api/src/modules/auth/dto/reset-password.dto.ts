import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResetPasswordDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Reset code must be 6 digits' })
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'Password must include 1 capital letter' })
  @Matches(/[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~;']/, {
    message: 'Password must include 1 symbol',
  })
  newPassword!: string;
}
