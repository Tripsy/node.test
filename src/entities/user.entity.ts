import {Entity, Column, DeleteDateColumn} from 'typeorm';
import {UserStatusEnum} from '../enums/user-status.enum';
import {BaseEntityAbstract} from './base-entity.abstract';

@Entity('user')
export default class UserEntity extends BaseEntityAbstract {
    @Column('char', {nullable: false, length: 64})
    name?: string;

    @Column('char', {nullable: true, length: 64, unique: true})
    email?: string;

    @Column('varchar', {nullable: true, select: false})
    password?: string;

    @Column({
        type: 'enum',
        enum: UserStatusEnum,
        default: UserStatusEnum.PENDING,
    })
    status?: UserStatusEnum;

    @DeleteDateColumn({type: 'timestamp', select: false})
    deleted_at?: Date;

    // @OneToMany(() => Post, post => post.user)
    // posts: Post[];
}
