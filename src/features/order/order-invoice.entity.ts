import { Column, Entity, Index, ManyToOne } from 'typeorm';
import {
	EntityAbstract,
	type EntityContextData,
} from '@/abstracts/entity.abstract';
import type { ClientTypeEnum } from '@/features/client/client.entity';
import type { DiscountSnapshot } from '@/features/discount/discount.entity';
import OrderEntity from '@/features/order/order.entity';

export enum InvoiceStatusEnum {
	DRAFT = 'draft', // Initial state, not sent to customer
	ISSUED = 'issued', // Invoice issued to customer
	PAID = 'paid', // Payment received in full
	OVERDUE = 'overdue', // Past due date, payment not received
	CANCELLED = 'cancelled', // Invoice invalidated
	REFUNDED = 'refunded', // Payment returned to customer
}

export type BillingDetailsPerson = {
	type: ClientTypeEnum.PERSON;

	// Person
	person_name: string;
	person_cnp?: string | null;

	// Financial
	iban?: string | null;
	bank_name?: string | null;

	// Address
	address_country: string;
	address_county?: string | null;
	address_city?: string | null;
	address_street?: string | null;
	address_postal_code?: string | null;

	// Contact
	contact_name?: string | null;
	contact_email?: string | null;
	contact_phone?: string | null;
};

export type BillingDetailsCompany = {
	type: ClientTypeEnum.COMPANY;

	// Company
	company_name: string;
	company_cui?: string | null;
	company_reg_com?: string | null;

	// Financial
	iban?: string | null;
	bank_name?: string | null;

	// Address
	address_country: string;
	address_county?: string | null;
	address_city?: string | null;
	address_street?: string | null;
	address_postal_code?: string | null;

	// Contact
	contact_name?: string | null;
	contact_email?: string | null;
	contact_phone?: string | null;
};

export type BillingDetails = BillingDetailsPerson | BillingDetailsCompany;

@Entity({
	name: 'order_invoice',
	schema: 'public',
	comment: 'Stores invoices generated from orders',
})
@Index('IDX_invoice_code_number', ['invoice_code', 'invoice_number'], {
	unique: true,
})
export default class OrderInvoiceEntity extends EntityAbstract {
	@Column('bigint', { nullable: false })
	@Index('IDX_order_invoice_order_id')
	order_id!: number;

	@Column('char', {
		length: 3,
		nullable: false,
		comment: 'Invoice series/code, e.g., ABC',
	})
	invoice_code!: string;

	@Column('int', {
		nullable: false,
		comment: 'Sequential invoice number within the series',
	})
	invoice_number!: number;

	@Index('IDX_order_invoice_status')
	@Column({
		type: 'enum',
		enum: InvoiceStatusEnum,
		default: InvoiceStatusEnum.DRAFT,
		nullable: false,
	})
	status!: InvoiceStatusEnum;

	@Column('char', {
		length: 3,
		nullable: false,
		default: 'RON',
		comment: 'Base currency for the invoice',
	})
	base_currency!: string;

	@Column('jsonb', {
		nullable: true,
		comment: 'Array of discount snapshots applied to this order',
	})
	discount?: DiscountSnapshot[];

	@Column({ type: 'timestamp', nullable: false })
	issued_at!: Date;

	@Column({ type: 'timestamp', nullable: true })
	due_at!: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	paid_at!: Date | null;

	@Column('jsonb', {
		nullable: true,
		comment:
			'Snapshot of billing info at the moment of issuing the invoice',
	})
	billing_details!: BillingDetails;

	@Column('text', { nullable: true })
	notes!: string | null;

	// VIRTUAL
	contextData?: EntityContextData;

	// RELATIONS
	@ManyToOne(() => OrderEntity, {
		onDelete: 'RESTRICT',
	})
	order!: OrderEntity;
}
