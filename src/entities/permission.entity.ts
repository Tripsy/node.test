import {Entity, Column, Index, PrimaryGeneratedColumn, DeleteDateColumn, OneToMany} from 'typeorm';
import OperatorPermissionEntity from './operator_permission.entity';

@Entity('permission')
@Index('IDX_permission', ['entity', 'operation'], { unique: true })
export default class PermissionEntity {
    @PrimaryGeneratedColumn({type: 'bigint', unsigned: false})
    id!: number;

    @Column('varchar', {nullable: false})
    entity!: string

    @Column('varchar', {nullable: false})
    operation!: string

    @DeleteDateColumn({type: 'timestamp', nullable: true, select: false})
    deleted_at?: Date;

    @OneToMany(() => OperatorPermissionEntity, (operatorPermission) => operatorPermission.permission_id)
    operator_permissions?: OperatorPermissionEntity[];

    // Virtual column
    contextData: Record<string, string | number> = {};
}
