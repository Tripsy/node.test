import { Column, Entity, Index, OneToMany } from 'typeorm';
import { EntityAbstract } from '@/abstracts/entity.abstract';
// import AccountRecoveryEntity from '@/features/account/account-recovery.entity';
// import AccountTokenEntity from '@/features/account/account-token.entity';
// import UserPermissionEntity from '@/features/user-permission/user-permission.entity';

export enum UserStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending',
}

export enum UserRoleEnum {
	ADMIN = 'admin',
	MEMBER = 'member',
	OPERATOR = 'operator',
}

export enum UserOperatorTypeEnum {
	SELLER = 'seller',
	PRODUCT_MANAGER = 'product_manager',
	CONTENT_EDITOR = 'content_editor',
}

@Entity({
	name: 'user',
	schema: 'public',
})
export default class UserEntity extends EntityAbstract {
	@Column('varchar', { nullable: false })
	name!: string;

	@Column('varchar', { nullable: false })
	@Index('IDX_user_email', { unique: true })
	email!: string;

	@Column({ type: 'timestamp', nullable: true })
	email_verified_at!: Date | null;

	@Column('varchar', { nullable: false, select: false })
	password!: string;

	@Column({ type: 'timestamp', nullable: false })
	password_updated_at!: Date;

	@Column('varchar', { length: 3, nullable: false })
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

	@Column({
		type: 'enum',
		enum: UserOperatorTypeEnum,
		nullable: true,
		comment: 'Operator type; only relevant when role is OPERATOR',
	})
	operator_type!: UserOperatorTypeEnum | null;

	// RELATIONS
	// @OneToMany(
	// 	() => AccountTokenEntity,
	// 	(accountToken) => accountToken.user,
	// )
	// account_tokens?: AccountTokenEntity[];
    //
	// @OneToMany(
	// 	() => AccountRecoveryEntity,
	// 	(accountRecovery) => accountRecovery.user,
	// )
	// account_recoveries?: AccountRecoveryEntity[];

	// @OneToMany(
	// 	() => UserPermissionEntity,
	// 	(userPermission) => userPermission.user,
	// )
	// permissions?: UserPermissionEntity[];
}
