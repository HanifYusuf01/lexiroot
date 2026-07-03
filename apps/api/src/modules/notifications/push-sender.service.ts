import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Expo,
  type ExpoPushMessage,
  type ExpoPushTicket,
  type ExpoPushReceipt,
} from 'expo-server-sdk';

/**
 * Thin wrapper over the Expo push SDK. It owns batching/chunking and the two
 * network calls we make: sending messages (returns *tickets*) and later
 * fetching *receipts* (the ground truth for APNs/FCM delivery).
 *
 * The access token enables Expo's enhanced push security and lives only in the
 * backend env (`EXPO_PUSH_ACCESS_TOKEN`) — never in the mobile bundle.
 */
@Injectable()
export class PushSenderService {
  private readonly logger = new Logger(PushSenderService.name);
  private readonly expo: Expo;

  constructor(config: ConfigService) {
    const accessToken = config.get<string>('EXPO_PUSH_ACCESS_TOKEN');
    if (!accessToken) {
      // Not fatal in local/dev — sends will still work without enhanced
      // security — but warn so it's obvious in prod logs.
      this.logger.warn('EXPO_PUSH_ACCESS_TOKEN not set; sending without enhanced push security');
    }
    this.expo = new Expo({ accessToken });
  }

  /** True if the string is a well-formed Expo push token. */
  static isValidToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Send messages in Expo-sized chunks. Returns tickets positionally aligned
   * with `messages` so callers can map ticket → device. A chunk that fails at
   * the transport layer yields synthesised `error` tickets for its messages so
   * the alignment never breaks.
   */
  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    for (const chunk of chunks) {
      try {
        const chunkTickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      } catch (err) {
        this.logger.error(`Expo send chunk failed: ${String(err)}`);
        for (let i = 0; i < chunk.length; i++) {
          tickets.push({ status: 'error', message: String(err) } as ExpoPushTicket);
        }
      }
    }
    return tickets;
  }

  /** Fetch receipts for previously-issued ticket ids, keyed by ticket id. */
  async getReceipts(ticketIds: string[]): Promise<Record<string, ExpoPushReceipt>> {
    const receipts: Record<string, ExpoPushReceipt> = {};
    const chunks = this.expo.chunkPushNotificationReceiptIds(ticketIds);
    for (const chunk of chunks) {
      try {
        Object.assign(receipts, await this.expo.getPushNotificationReceiptsAsync(chunk));
      } catch (err) {
        this.logger.error(`Expo receipt fetch failed: ${String(err)}`);
      }
    }
    return receipts;
  }
}
