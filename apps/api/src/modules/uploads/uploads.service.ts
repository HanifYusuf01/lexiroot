import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface AvatarSignaturePayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
  /** Bytes. Signed, so Cloudinary rejects anything larger server-side. */
  maxFileSize: number;
}

export interface MediaSignaturePayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
  resourceType: 'image' | 'video';
}

/**
 * Ceiling on an avatar upload, in bytes.
 *
 * Signed into the request so Cloudinary enforces it — a client-side check
 * would be advice, not a limit. Without one, any signed-in account can post
 * files of any size into its avatar folder as often as it likes, and Cloudinary
 * bills us for the storage and the bandwidth. Generous for a profile picture,
 * useless as a file dump.
 */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly config: ConfigService) {
    this.cloudName = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.config.getOrThrow<string>('CLOUDINARY_API_KEY');
    this.apiSecret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');
  }

  /**
   * Build a one-time signed payload for the avatar upload endpoint.
   * The client posts the file + these fields to /v1_1/{cloud}/image/upload directly,
   * so the API secret never leaves the server.
   */
  signAvatarUpload(userId: string): AvatarSignaturePayload {
    const timestamp = Math.floor(Date.now() / 1000);
    // Scoped per user, so one account's signature cannot overwrite another's.
    const folder = `lexiroot/avatars/${userId}`;
    const paramsToSign = { timestamp, folder, max_file_size: MAX_AVATAR_BYTES };
    let signature: string;
    try {
      signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret);
    } catch {
      throw new InternalServerErrorException('Could not sign upload');
    }
    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      signature,
      folder,
      maxFileSize: MAX_AVATAR_BYTES,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  signLessonMediaUpload(kind: 'audio' | 'image'): MediaSignaturePayload {
    return this.signMediaUpload(`lexiroot/lessons/${kind}`, kind);
  }

  signCulturalMediaUpload(kind: 'audio' | 'image'): MediaSignaturePayload {
    return this.signMediaUpload(`lexiroot/cultural-content/${kind}`, kind);
  }

  private signMediaUpload(folder: string, kind: 'audio' | 'image'): MediaSignaturePayload {
    const timestamp = Math.floor(Date.now() / 1000);
    const resourceType: 'image' | 'video' = kind === 'audio' ? 'video' : 'image';
    const paramsToSign = { timestamp, folder };
    let signature: string;
    try {
      signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret);
    } catch {
      throw new InternalServerErrorException('Could not sign upload');
    }
    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      signature,
      folder,
      resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
    };
  }
}
