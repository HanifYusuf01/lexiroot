import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppleAuthDto {
  // Apple identity token (JWT) obtained on the client via expo-apple-authentication.
  @IsString()
  @IsNotEmpty()
  identityToken!: string;

  // Full name from AppleAuthenticationCredential — Apple only sends it on the
  // user's first authorization, so it's absent on every later sign-in.
  @IsOptional()
  @IsString()
  fullName?: string;
}
