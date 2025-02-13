import {Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn} from 'typeorm';

@Entity()
export class BaseEntityAbstract {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id?: number;

    @CreateDateColumn({type: 'timestamp'})
    created_at?: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updated_at?: Date;

    @DeleteDateColumn({type: 'timestamp', select: false})
    deleted_at?: Date;
}
