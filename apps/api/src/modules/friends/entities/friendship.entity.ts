import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * One direction of a mutual friendship. Both rows are written on accept and
 * removed together, so "my friends" stays a plain indexed lookup on `userId`
 * instead of an OR across two columns.
 */
@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'friend_id', type: 'uuid' })
  friendId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
