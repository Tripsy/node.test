import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
export enum LogDataCategoryEnum {
	SYSTEM = 'system',
	HISTORY = 'history',
	CRON = 'cron',
	INFO = 'info',
	ERROR = 'error',
}

export enum LogDataLevelEnum {
	TRACE = 'trace', // 10
	DEBUG = 'debug', // 20
	INFO = 'info', // 30
	WARN = 'warn', // 40
	ERROR = 'error', // 50
	FATAL = 'fatal', // 60
}

@Entity({
	name: 'log_data',
	schema: 'logs',
})
@Index('idx_log_data', ['created_at', 'level', 'category'])
export default class LogDataEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('char', { length: 36, nullable: false })
	@Index('IDX_log_data_pid')
	pid!: string;

	@Column('varchar', { nullable: false })
	category!: string;

	@Column({
		type: 'enum',
		enum: LogDataLevelEnum,
		nullable: false,
	})
	level!: LogDataLevelEnum;

	@Column('text')
	message?: string;

	@Column('simple-json', { nullable: true })
	context?: Record<string, unknown>;

	@Column('simple-json', { nullable: true })
	debugStack?: Record<string, unknown>;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;
}
