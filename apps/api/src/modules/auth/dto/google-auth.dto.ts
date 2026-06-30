import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  // Google ID token (JWT) obtained on the client via @react-native-google-signin.
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
