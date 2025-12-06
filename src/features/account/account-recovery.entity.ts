import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import UserEntity from '@/features/user/user.entity';

@Entity({
	name: 'account_recovery',
	schema: 'system',
	comment: 'Stores `ident` for account password recovery requests',
})
export default class AccountRecoveryEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('bigint', { unsigned: false, nullable: false })
	@Index('IDX_account_recovery_user_id')
	user_id!: number;

	@Column('char', { length: 36, nullable: false, unique: true })
	@Index('IDX_account_recovery_ident', { unique: true })
	ident!: string;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@Column({ type: 'json', nullable: true, comment: 'Fingerprinting data' })
	metadata?: Record<string, unknown>;

	@Column({ type: 'timestamp', nullable: true })
	used_at!: Date | null;

	@Column({ type: 'timestamp', nullable: false })
	expire_at!: Date;

	// RELATIONS
	@ManyToOne(() => UserEntity, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity;
}
