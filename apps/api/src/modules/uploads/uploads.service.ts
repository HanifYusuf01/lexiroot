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
    const folder = `lexiroot/avatars/${userId}`;
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
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  signLessonMediaUpload(kind: 'audio' | 'image'): MediaSignaturePayload {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `lexiroot/lessons/${kind}`;
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
