import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CronHistoryStatusEnum } from '@/features/cron-history/cron-history-status.enum';

@Entity({
	name: 'cron_history',
	schema: 'logs',
	comment: 'Stores cron usage',
})
export default class CronHistoryEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('varchar', { nullable: false })
	label!: string;

	@Index('IDX_cron_history_start_at', { unique: false })
	@Column({ type: 'timestamp', nullable: false })
	start_at!: Date;

	@Column({ type: 'timestamp', nullable: false })
	end_at!: Date;

	@Index('IDX_cron_history_status', { unique: false })
	@Column({
		type: 'enum',
		enum: CronHistoryStatusEnum,
		nullable: false,
	})
	status!: CronHistoryStatusEnum;

	@Column('int', {
		nullable: false,
		default: 0,
		comment: 'Run time in seconds',
	})
	run_time!: number;

	@Column({ type: 'jsonb', nullable: true, comment: 'Cron data' })
	content?: Record<string, unknown>;
}
