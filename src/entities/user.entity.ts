import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserStatusEnum } from '../enums/user-status.enum';

@Entity()
export default class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { nullable: false })
    name: string;

    @Column('text', { nullable: true })
    email: string;

    @Column('text', { nullable: true })
    password: string;

    @Column({
        type: 'varchar',
        enum: UserStatusEnum,
        default: UserStatusEnum.PENDING,
    })
    status: UserStatusEnum;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    // @OneToMany(() => Post, post => post.user)
    // posts: Post[];
}
