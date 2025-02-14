import {Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn} from 'typeorm';

@Entity()
export class BaseEntityAbstract {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id!: number;

    @CreateDateColumn({type: 'timestamp', nullable: false})
    created_at!: Date;

    @UpdateDateColumn({type: 'timestamp', nullable: true})
    updated_at?: Date;

    @DeleteDateColumn({type: 'timestamp', nullable: true, select: false})
    deleted_at?: Date;
}
