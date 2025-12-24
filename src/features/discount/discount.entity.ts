import { Column, Entity, Index } from 'typeorm';
import { EntityAbstract } from '@/lib/abstracts/entity.abstract';

export enum DiscountScopeEnum {
	CLIENT = 'client',
	ORDER = 'order',
	PRODUCT = 'product',
	CATEGORY = 'category',
	COUNTRY = 'country',
}

export enum DiscountTypeEnum {
	PERCENT = 'percent',
	AMOUNT = 'amount',
}

export enum DiscountReasonEnum {
	FLASH_SALE = 'flash_sale',
	FIRST_TIME_CUSTOMER = 'first_time_customer',
	LOYALTY_DISCOUNT = 'loyalty_discount',
	BIRTHDAY_DISCOUNT = 'birthday_discount',
	REFERRAL_DISCOUNT = 'referral_discount',
	VIP_DISCOUNT = 'vip_discount',
	SPECIAL_DISCOUNT = 'special_discount',
}

/*
    @example
    {
      "min_order_value": 100,           // number
      "eligible_categories": [1, 2, 5], // number[]
      "applicable_countries": ["RO"]    // string[]
    }
*/
export type DiscountRules = Record<string, number | number[] | string[]>;

export type DiscountSnapshot = {
	label: string;
	scope: DiscountScopeEnum;
	reason: DiscountReasonEnum;
	reference?: string | null;
	type: DiscountTypeEnum;
	rules?: DiscountRules;
	value: number;
};

const ENTITY_TABLE_NAME = 'discount';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment:
		'Stores discount definitions. Note: Discount applied only for prices without VAT before exchange rate conversion',
})
@Index('IDX_discount_active', ['start_at', 'end_at', 'scope'])
export default class DiscountEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('varchar', { nullable: false, comment: 'Discount name' })
	label!: string;

	@Column({
		type: 'enum',
		enum: DiscountScopeEnum,
		nullable: false,
	})
	@Index('IDX_discount_scope')
	scope!: DiscountScopeEnum;

	@Column({
		type: 'enum',
		enum: DiscountReasonEnum,
		nullable: false,
	})
	@Index('IDX_discount_reason')
	reason!: DiscountReasonEnum;

	@Column('varchar', {
		nullable: true,
		comment: 'Coupon code, referral code, etc',
	})
	@Index('IDX_discount_reference')
	reference!: string | null;

	@Column({
		type: 'enum',
		enum: DiscountTypeEnum,
		nullable: false,
	})
	type!: DiscountTypeEnum;

	@Column('jsonb', {
		nullable: true,
		comment: 'Optional rules or conditions for discount applicability',
	})
	rules?: DiscountRules;

	@Column('decimal', { precision: 12, scale: 2, nullable: false })
	value!: number;

	@Column({ type: 'timestamp', nullable: true })
	start_at!: Date | null;

	@Column({ type: 'timestamp', nullable: true })
	end_at!: Date | null;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;
}
