import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

export enum PaymentStatusEnum {
	PENDING = 'pending', // Created, waiting for gateway or user redirect
	AUTHORIZED = 'authorized', // Payment authorized but not captured
	COMPLETED = 'completed', // Money captured
	FAILED = 'failed',
	REFUNDED = 'refunded',
	PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentGatewayEnum {
	STRIPE = 'stripe',
	PAYPAL = 'paypal',
	MANUAL = 'manual',
}

const ENTITY_TABLE_NAME = 'payment';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Tracks payments from various gateways and links them to invoices.',
})
export default class PaymentEntity {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@PrimaryGeneratedColumn({ type: 'bigint', unsigned: false })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@Column('bigint', { nullable: false })
	@Index('IDX_payment_invoice_id')
	invoice_id!: number;

	@Column({
		type: 'enum',
		enum: PaymentGatewayEnum,
		nullable: false,
	})
	gateway!: PaymentGatewayEnum;

	@Column({
		type: 'enum',
		enum: PaymentStatusEnum,
		default: PaymentStatusEnum.PENDING,
		nullable: false,
	})
	@Index('IDX_payment_status')
	status!: PaymentStatusEnum;

	@Column('decimal', {
		precision: 12,
		scale: 2,
		nullable: false,
		comment: 'Amount intended to be charged',
	})
	amount!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
	})
	currency!: string;

	@Column('varchar', {
		nullable: true,
		comment: 'Gateway transaction ID (e.g., Stripe charge id)',
	})
	@Index('IDX_payment_transaction_id')
	transaction_id!: string | null;

	@Column('jsonb', {
		nullable: true,
		comment: 'Full gateway response snapshot for debugging/audit',
	})
	gateway_response!: Record<string, unknown> | null;

	@Column('text', { nullable: true })
	fail_reason!: string | null;
}
