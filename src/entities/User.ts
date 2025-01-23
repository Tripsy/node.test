import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm'
import UserStatus from '../enums/UserStatus'

@Entity()
export default class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    email: string

    @Column()
    password: string

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.Pending,
    })
    status: UserStatus

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamp', default: (): string => 'CURRENT_TIMESTAMP' })
    updated_at: Date

    // @OneToMany(() => Post, post => post.user)
    // posts: Post[];
}
