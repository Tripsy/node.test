import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import AccountTokenEntity from '@/features/account/account-token.entity';
import { UserRoleEnum } from '@/features/user/user-role.enum';
import { UserStatusEnum } from '@/features/user/user-status.enum';
import UserPermissionEntity from '@/features/user-permission/user-permission.entity';

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

	@Column({ type: 'timestamp', nullable: true })
	email_verified_at!: Date | null;

	@Column('varchar', { nullable: false, select: false })
	password!: string;

	@Column({ type: 'timestamp', nullable: false })
	password_updated_at!: Date;

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
