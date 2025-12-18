import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum CronHistoryStatusEnum {
	ERROR = 'error',
	OK = 'ok',
	WARNING = 'warning', // Set when cron job is not running in expected time
}

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

	@Column({ type: 'timestamp', nullable: false })
	@Index('IDX_cron_history_start_at', { unique: false })
	start_at!: Date;

	@Column({ type: 'timestamp', nullable: false })
	end_at!: Date;

	@Column({
		type: 'enum',
		enum: CronHistoryStatusEnum,
		nullable: false,
	})
	@Index('IDX_cron_history_status', { unique: false })
	status!: CronHistoryStatusEnum;

	@Column('smallint', {
		nullable: false,
		default: 0,
		comment: 'Run time in seconds',
	})
	run_time!: number;

	@Column({ type: 'jsonb', nullable: true, comment: 'Cron data' })
	content?: Record<string, unknown>;
}
