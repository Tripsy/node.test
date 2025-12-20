import {
	Column,
	DeleteDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
// import UserPermissionEntity from '@/features/user-permission/user-permission.entity';

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

	// // RELATIONS
	// @OneToMany(
	// 	() => UserPermissionEntity,
	// 	(userPermission) => userPermission.permission,
	// )
	// user_permissions?: UserPermissionEntity[];
}
