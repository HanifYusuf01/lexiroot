import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';

/**
 * Public (no JWT) provider webhook endpoints. Authentication IS the signature
 * check (Rules 3a/9b) — performed inside WebhooksService via the provider. The
 * raw request body is required for signature verification, so `rawBody: true`
 * must be enabled in main.ts.
 */
@Controller('payments/webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post('stripe')
  @HttpCode(200)
  async stripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    if (!req.rawBody) throw new BadRequestException('Missing raw body');
    if (!signature) throw new BadRequestException('Missing stripe-signature header');
    try {
      await this.webhooks.handle('stripe', req.rawBody, signature);
    } catch (err) {
      // A bad signature must reject with 400 so nothing is processed. Genuine
      // processing failures also surface here → non-2xx makes Stripe retry.
      if (isSignatureError(err)) throw new BadRequestException('Invalid signature');
      throw err;
    }
    return { received: true };
  }
}

function isSignatureError(err: unknown): boolean {
  const type = (err as { type?: string })?.type;
  return type === 'StripeSignatureVerificationError';
}
