export interface XpLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Streak {
  userId: string;
  current: number;
  longest: number;
  lastActiveDate: string;
}
