import {
	Column,
	DeleteDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type { EntityContextData } from '@/abstracts/entity.abstract';
import UserPermissionEntity from '@/features/user-permission/user-permission.entity';

@Entity({
	name: 'permission',
	schema: 'system',
	comment: 'Stores permissions',
})
@Index('IDX_permission', ['entity', 'operation'], { unique: true })
export default class PermissionEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('varchar', { nullable: false })
	entity!: string;

	@Column('varchar', { nullable: false })
	operation!: string;

	@DeleteDateColumn({ type: 'timestamp', nullable: true, select: true })
	deleted_at!: Date | null;

	@OneToMany(
		() => UserPermissionEntity,
		(userPermission) => userPermission.permission_id,
	)
	user_permissions?: UserPermissionEntity[];

	// Virtual column
	contextData?: EntityContextData;
}
