import {Entity, Column, PrimaryGeneratedColumn, Index} from 'typeorm';
import {CronHistoryStatusEnum} from '../enums/cron-history-status.enum';

@Entity('cron_history', {
    comment: 'Stores cron usage',
})
export default class CronHistoryEntity {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id!: number;

    @Column('varchar', {nullable: false})
    label!: string

    @Index('IDX_cron_history_start_at', { unique: false })
    @Column({type: 'timestamp', nullable: false})
    start_at!: Date;

    @Column({type: 'timestamp', nullable: false})
    end_at!: Date;

    @Index('IDX_cron_history_status', { unique: false })
    @Column({
        type: 'enum',
        enum: CronHistoryStatusEnum,
        nullable: false
    })
    status!: CronHistoryStatusEnum;

    @Column('int', { nullable: false, default: 0, comment: 'Run time in seconds' })
    run_time!: number;

    @Column({ type: 'json', nullable: true, comment: 'Cron data' })
    content?: Record<string, any>;
}


