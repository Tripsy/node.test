import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type OrderEntity from '@/features/order/order.entity';
import type UserEntity from '@/features/user/user.entity';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

export enum SubscriptionStatusEnum {
	ACTIVE = 'active',
	PAUSED = 'paused',
	CANCELLED = 'cancelled',
	EXPIRED = 'expired',
}

@Entity({
	name: 'subscription',
	schema: 'public',
	comment: 'Recurring subscriptions created from orders',
})
@Index('IDX_subscription_end_at', ['end_at', 'status'], {
	unique: true,
})
export default class SubscriptionEntity extends EntityAbstract {
	@Index('IDX_subscription_order_id', { unique: true })
	@Column('bigint', { nullable: false })
	order_id!: number;

	@Column('bigint', {
		nullable: true,
		comment: 'When subscription is assigned to a user (virtual services)',
	})
	user_id!: number | null;

	@Column('int', {
		nullable: false,
		comment: 'Subscription reference code (e.g., S12345)',
	})
	@Index('IDX_subscription_ref_code', {
		unique: true,
	})
	ref_code!: number;

	@Column({
		type: 'enum',
		enum: SubscriptionStatusEnum,
		default: SubscriptionStatusEnum.ACTIVE,
		nullable: false,
	})
	@Index('IDX_subscription_status')
	status!: SubscriptionStatusEnum;

	@Column('timestamp', {
		nullable: true,
		comment: 'When the subscription started',
	})
	start_at!: Date | null;

	@Column('timestamp', {
		nullable: true,
		comment: 'When the subscription ended (if cancelled/expired)',
	})
	end_at!: Date | null;

	@Column('smallint', {
		nullable: false,
		comment:
			'Number of days offered past end at as a grace period to allow renewals',
		default: 0,
	})
	grace_period!: number;

	@Column('boolean', {
		nullable: false,
		default: true,
		comment: 'Whether the subscription renews automatically',
	})
	auto_renew!: boolean;

	@Column('smallint', {
		nullable: false,
		comment:
			'Max count of renewals attempts before the subscription is marked as expired',
	})
	retry_count!: number;

	@Column('smallint', {
		nullable: false,
		comment: 'Number of days between each renewal attempt',
	})
	retry_interval!: number;

	@Column('timestamp', {
		nullable: true,
		comment: 'Next scheduled billing date',
	})
	next_billing_at!: Date | null;

	@Column('text', { nullable: true })
	notes!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Reserved column for future use',
	})
	details!: Record<string, string | number | boolean>;

	// RELATIONS
	@ManyToOne('OrderEntity', {
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'order_id' })
	order!: OrderEntity;

	@ManyToOne('UserEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'user_id' })
	user?: UserEntity | null;
}
