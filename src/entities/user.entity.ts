import {Entity, Column, OneToMany, Index} from 'typeorm';
import {UserStatusEnum} from '../enums/user-status.enum';
import {BaseEntityAbstract} from './base-entity.abstract';
import AccountTokenEntity from './account_token.entity';

@Entity('user')
export default class UserEntity extends BaseEntityAbstract {
    @Column('varchar', {nullable: false})
    name!: string

    @Column('varchar', {nullable: false, unique: true})
    @Index('IDX_user_email', { unique: true })
    email!: string;

    @Column('varchar', {nullable: false, select: false})
    password!: string;

    @Column({
        type: 'enum',
        enum: UserStatusEnum,
        default: UserStatusEnum.PENDING,
        nullable: false
    })
    status!: UserStatusEnum;

    @Column({type: 'timestamp', nullable: true, comment: 'Timestamp of the last login'})
    login_at?: Date;

    @OneToMany(() => AccountTokenEntity, (accountToken) => accountToken.user)
    account_tokens?: AccountTokenEntity[];
}
