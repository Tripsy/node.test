import {Entity, Column, OneToMany, Index} from 'typeorm';
import {UserStatusEnum} from '../enums/user-status.enum';
import {BaseEntityAbstract} from './base-entity.abstract';
import AccountTokenEntity from './account-token.entity';
import AccountRecoveryEntity from './account-recovery.entity';

@Entity('user')
export default class UserEntity extends BaseEntityAbstract {
    @Column('varchar', {nullable: false})
    name!: string

    @Column('varchar', {nullable: false, unique: true})
    @Index('IDX_user_email', { unique: true })
    email!: string;

    @Column('varchar', {nullable: false, select: false})
    password!: string;

    @Column('char', {length: 2, nullable: false})
    language!: string;

    @Column({
        type: 'enum',
        enum: UserStatusEnum,
        default: UserStatusEnum.PENDING,
        nullable: false
    })
    status!: UserStatusEnum;

    @OneToMany(() => AccountTokenEntity, (accountToken) => accountToken.user)
    account_tokens?: AccountTokenEntity[];

    @OneToMany(() => AccountRecoveryEntity, (accountRecovery) => accountRecovery.user)
    account_recoveries?: AccountRecoveryEntity[];
}
