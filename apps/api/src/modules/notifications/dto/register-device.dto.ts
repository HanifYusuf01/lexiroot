import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { PUSH_PLATFORMS, type PushPlatform } from '@lexiroot/shared';

export class RegisterDeviceDto {
  @IsString()
  @Length(1, 128)
  installationId!: string;

  // Expo tokens look like `ExponentPushToken[xxxx]` (or the older FCM/APNs
  // form). Enforce the shape so we never store obviously-bogus tokens.
  @IsString()
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[.+\]$/, {
    message: 'expoToken must be a valid Expo push token',
  })
  expoToken!: string;

  @IsIn(PUSH_PLATFORMS as readonly string[])
  platform!: PushPlatform;

  // IANA zone id, e.g. `Africa/Lagos`. We reject fixed offsets like `UTC+1`.
  @IsString()
  @Length(1, 64)
  timezone!: string;

  @IsString()
  @Length(1, 16)
  locale!: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  appVersion?: string;
}
