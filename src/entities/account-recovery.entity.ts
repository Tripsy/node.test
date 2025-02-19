import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn} from 'typeorm';
import UserEntity from './user.entity';

@Entity('account_recovery', {
    comment: 'Stores `ident` for account password recovery requests'
})
export default class AccountRecoveryEntity {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id!: number;

    @Column('bigint', {unsigned: false, nullable: false})
    @Index('IDX_account_token_user_id')
    user_id!: number;

    @Column('char', {length: 36, nullable: false, unique: true})
    @Index('IDX_account_token_ident', { unique: true })
    ident!: string;

    @CreateDateColumn({type: 'timestamp', nullable: false})
    created_at!: Date;

    @Column({ type: 'json', nullable: true, comment: 'Fingerprinting data' })
    metadata?: Record<string, any>;

    @Column({type: 'timestamp', nullable: true})
    used_at?: Date;

    @Column({type: 'timestamp', nullable: false})
    expire_at!: Date;

    @ManyToOne(() => UserEntity, (user) => user.account_recoveries, {onDelete: 'CASCADE'})
    @JoinColumn({
        name: 'user_id', // The column in this entity that references the foreign key
        referencedColumnName: 'id', // The column in the referenced entity (UserEntity)
        foreignKeyConstraintName: 'FK_account_token_user_id', // Custom foreign key name
    })
    user?: UserEntity;
}
