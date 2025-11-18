import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '../../abstracts/entity.abstract';
import AccountRecoveryEntity from '../account/account-recovery.entity';
import AccountTokenEntity from '../account/account-token.entity';
import UserPermissionEntity from '../user-permission/user-permission.entity';
import { UserRoleEnum } from './user-role.enum';
import { UserStatusEnum } from './user-status.enum';

@Entity({
	name: 'user',
	schema: 'public',
	comment: 'Stores email & page templates',
})
export default class UserEntity extends EntityAbstract {
	@Column('varchar', { nullable: false })
	name!: string;

	@Column('varchar', { nullable: false, unique: true })
	@Index('IDX_user_email', { unique: true })
	email!: string;

	@Column('varchar', { nullable: false, select: false })
	password!: string;

	@Column('char', { length: 2, nullable: false })
	language!: string;

	@Column({
		type: 'enum',
		enum: UserStatusEnum,
		default: UserStatusEnum.PENDING,
		nullable: false,
	})
	status!: UserStatusEnum;

	@Column({
		type: 'enum',
		enum: UserRoleEnum,
		default: UserRoleEnum.MEMBER,
		nullable: false,
	})
	role!: UserRoleEnum;

	@OneToMany(
		() => AccountTokenEntity,
		(accountToken) => accountToken.user,
	)
	account_tokens?: AccountTokenEntity[];

	@OneToMany(
		() => AccountRecoveryEntity,
		(accountRecovery) => accountRecovery.user,
	)
	account_recoveries?: AccountRecoveryEntity[];

	@OneToMany(
		() => UserPermissionEntity,
		(userPermission) => userPermission.user,
	)
	permissions?: UserPermissionEntity[];

	// Virtual column
	contextData?: EntityContextData;
}
