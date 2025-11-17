import {
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity()
export class BaseEntityAbstract {
	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@DeleteDateColumn({ type: 'timestamp', nullable: true, select: true })
	deleted_at!: Date | null;
}
