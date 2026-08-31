import { IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import {
  COUNTRY_CODES,
  LEARNING_LEVELS,
  LEARNING_REASONS,
  type CountryCode,
  type LearningLevel,
  type LearningReason,
} from '@lexiroot/shared';


export class GoogleAuthDto {
  // Google ID token (JWT) obtained on the client via @react-native-google-signin.
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  // Onboarding answers, collected before the account exists. Applied only when
  // this sign-in creates the user — a returning user's saved profile must never
  // be overwritten by whatever is left in the client's onboarding state.
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2,3}$/, { message: 'language must be a 2–3 letter code' })
  language?: string;

  @IsOptional()
  @IsIn(LEARNING_LEVELS as readonly string[])
  level?: LearningLevel;

  @IsOptional()
  @IsIn(LEARNING_REASONS as readonly string[])
  reason?: LearningReason;

  @IsOptional()
  @IsIn(COUNTRY_CODES as readonly string[])
  country?: CountryCode;
}
