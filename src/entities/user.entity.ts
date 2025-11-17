import { Column, Entity, Index, OneToMany } from 'typeorm';
import { UserRoleEnum } from '../enums/user-role.enum';
import { UserStatusEnum } from '../enums/user-status.enum';
import type { EntityContextData } from '../types/entity-context-data.type';
import AccountRecoveryEntity from './account-recovery.entity';
import AccountTokenEntity from './account-token.entity';
import { BaseEntityAbstract } from './base-entity.abstract';
import UserPermissionEntity from './user-permission.entity';

@Entity({
	name: 'user',
	schema: 'public',
	comment: 'Stores email & page templates',
})
export default class UserEntity extends BaseEntityAbstract {
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
