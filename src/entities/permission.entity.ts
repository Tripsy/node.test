import {Entity, Column, Index, PrimaryGeneratedColumn, DeleteDateColumn, OneToMany} from 'typeorm';
import UserPermissionEntity from './user-permission.entity';
import {EntityContextData} from '../types/entity-context-data.type';

@Entity({
    name: 'permission',
    schema: 'system',
    comment: 'Stores permissions'
})
@Index('IDX_permission', ['entity', 'operation'], { unique: true })
export default class PermissionEntity {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id!: number;

    @Column('varchar', {nullable: false})
    entity!: string

    @Column('varchar', {nullable: false})
    operation!: string

    @DeleteDateColumn({type: 'timestamp', nullable: true, select: true})
    deleted_at?: Date;

    @OneToMany(() => UserPermissionEntity, (userPermission) => userPermission.permission_id)
    user_permissions?: UserPermissionEntity[];

    // Virtual column
    contextData?: EntityContextData;
}
