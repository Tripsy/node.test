import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index} from 'typeorm';
import {PinoLevelEnum} from '../enums/pino-level.enum';

@Entity('log_data')
@Index('idx_log_data', ['created_at_date', 'level', 'category'])
export default class LogDataEntity {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id!: number;

    @Column('varchar', {nullable: false})
    category!: string;

    @Column({
        type: 'enum',
        enum: PinoLevelEnum,
        nullable: false
    })
    level!: PinoLevelEnum;

    @Column('text')
    message?: string;

    @Column('simple-json', {nullable: true})
    context?: Record<string, any>;

    @Column('simple-json', {nullable: true})
    debugStack?: Record<string, any>;

    @CreateDateColumn({type: 'timestamp', nullable: false})
    created_at!: Date;

    @Column({type: 'date', asExpression: 'DATE(created_at)', generatedType: 'STORED', select: false})
    created_at_date!: string;
}
