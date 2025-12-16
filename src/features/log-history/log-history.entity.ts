import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import UserEntity from '@/features/user/user.entity';

@Entity({
	name: 'log_history',
	schema: 'logs',
	comment: 'Store entities history: created, updated, deleted, etc.',
})
@Index('IDX_log_history_entity_id_action', ['entity_id', 'entity', 'action'], {
	unique: false,
})
export default class LogHistoryEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('varchar', { nullable: false })
	entity!: string;

	@Column({ type: 'bigint', nullable: false })
	entity_id!: number;

	@Column({ type: 'varchar', nullable: false })
	action!: string;

	@Column({ type: 'bigint', nullable: true })
	@Index('IDX_log_history_auth_id', { unique: false })
	auth_id!: number;

	@Column({ type: 'bigint', nullable: false })
	@Index('IDX_log_history_request_id', { unique: false })
	request_id!: number;

	@Column({ type: 'timestamp', nullable: false })
	@Index('IDX_log_history_recorded_at', { unique: false })
	recorded_at!: Date;

	@Column({ type: 'jsonb', nullable: true, comment: 'Log data' })
	details?: Record<string, unknown>;

	// RELATIONS
	@ManyToOne(() => UserEntity, {
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'auth_id', referencedColumnName: 'id' })
	user?: UserEntity | null;
}
