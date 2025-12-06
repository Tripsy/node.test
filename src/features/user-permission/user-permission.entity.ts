import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import type { EntityContextData } from '@/abstracts/entity.abstract';
import PermissionEntity from '@/features/permission/permission.entity';
import UserEntity from '@/features/user/user.entity';

@Entity({
	name: 'user_permission',
	schema: 'public',
	comment: 'Stores user permissions',
})
@Index('IDX_user_permission_permission', ['user_id', 'permission_id'], {
	unique: true,
})
export default class UserPermissionEntity {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@Column('bigint', { unsigned: false, nullable: false })
	user_id!: number;

	@Column('bigint', { unsigned: false, nullable: false })
	permission_id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@DeleteDateColumn({ type: 'timestamp', nullable: true, select: false })
	deleted_at!: Date | null;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => UserEntity, {
		onDelete: 'CASCADE',
	})
	user?: UserEntity;

	@ManyToOne(() => PermissionEntity, {
		onDelete: 'CASCADE',
	})
	permission?: PermissionEntity;
}
