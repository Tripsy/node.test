import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm'
import UserStatus from '../enums/UserStatus'

@Entity()
export default class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column('text', {nullable: false})
    name: string

    @Column('text',{nullable:true})
    email: string

    @Column('text',{nullable:true})
    password: string

    @Column({
        type: 'varchar',
        enum: UserStatus,
        default: UserStatus.Pending,
    })
    status: UserStatus

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date

    // @OneToMany(() => Post, post => post.user)
    // posts: Post[];
}
