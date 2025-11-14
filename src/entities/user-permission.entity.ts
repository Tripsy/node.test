import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
    DeleteDateColumn
} from 'typeorm';
import UserEntity from './user.entity';
import PermissionEntity from './permission.entity';
import {EntityContextData} from '../types/entity-context-data.type';

@Entity({
    name: 'user_permission',
    schema: 'public',
    comment: 'Stores user permissions'
})
@Index('IDX_user_permission_permission', ['user_id', 'permission_id'], { unique: true })
export default class UserPermissionEntity {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id!: number;

    @Column('bigint', {unsigned: false, nullable: false})
    user_id!: number;

    @Column('bigint', {unsigned: false, nullable: false})
    permission_id!: number;

    @CreateDateColumn({type: 'timestamp', nullable: false})
    created_at!: Date;

    @DeleteDateColumn({type: 'timestamp', nullable: true, select: false})
    deleted_at?: Date;

    @ManyToOne(() => UserEntity, (user) => user.permissions, {onDelete: 'CASCADE'})
    @JoinColumn({
        name: 'user_id', // The column in this entity that references the foreign key
        referencedColumnName: 'id', // The column in the referenced entity (UserEntity)
        foreignKeyConstraintName: 'FK_user_permission_user_id', // Custom foreign key name
    })
    user?: UserEntity;

    @ManyToOne(() => PermissionEntity, (permission) => permission.user_permissions, {onDelete: 'CASCADE'})
    @JoinColumn({
        name: 'permission_id', // The column in this entity that references the foreign key
        referencedColumnName: 'id', // The column in the referenced entity (UserEntity)
        foreignKeyConstraintName: 'FK_user_permission_permission_id', // Custom foreign key name
    })
    permission?: PermissionEntity;

    // Virtual column
    contextData?: EntityContextData;
}
