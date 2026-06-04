import { Entity, Index, PrimaryColumn } from 'typeorm';

// One row per (user, UTC day) the user did anything meaningful. This is the
// source of truth for DAU/WAU/MAU and the activity time series 
// roster rather than a single `last_active_at` snapshot. Written (idempotently,
// ON CONFLICT DO NOTHING) from UsersService.touchActivity.
@Entity('user_active_days')
@Index('IDX_user_active_days_day', ['day'])
export class UserActiveDay {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'day', type: 'date' })
  day!: string;
}
