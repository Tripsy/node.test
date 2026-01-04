import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import type { CarrierValidatorFindDto } from '@/features/carrier/carrier.validator';
import DiscountEntity from '@/features/discount/discount.entity';
import { discountPolicy } from '@/features/discount/discount.policy';
import { getDiscountRepository } from '@/features/discount/discount.repository';
import {
	DiscountCreateValidator,
	DiscountFindValidator,
	DiscountUpdateValidator,
	paramsUpdateList,
} from '@/features/discount/discount.validator';
import type { UserValidatorCreateDto } from '@/features/user/user.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { BadRequestError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class DiscountController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: IDiscountValidator,
		private cache: CacheProvider,
		private discountService: IDiscountService,
	) {
		super();
	}
	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate<UserValidatorCreateDto>(
			this.validator.create(),
			req.body,
			res,
		);

		const discount = new DiscountEntity();
		discount.label = validated.data.label;
		discount.scope = validated.data.scope;
		discount.reason = validated.data.reason;
		discount.reference = validated.data.reference ?? null;
		discount.type = validated.data.type;
		discount.rules = validated.data.rules;
		discount.value = validated.data.value;
		discount.start_at = validated.data.start_at ?? null;
		discount.end_at = validated.data.end_at ?? null;
		discount.notes = validated.data.notes ?? null;

		const entry: DiscountEntity =
			await getDiscountRepository().save(discount);

		res.locals.output.data(entry);
		res.locals.output.message(lang('discount.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			DiscountEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const discount = await this.cache.get(cacheKey, async () => {
			return getDiscountRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(this.policy.allowDeleted(res.locals.auth))
				.firstOrFail();
		});

		res.locals.output.meta(this.cache.isCached, 'isCached');
		res.locals.output.data(discount);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const data = this.validate<UserValidatorCreateDto>(
			this.validator.create(),
			req.body,
			res,
		);

		const discount = await getDiscountRepository()
			.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		const updatedEntity: Partial<DiscountEntity> = {
			id: discount.id,
			...(Object.fromEntries(
				Object.entries(validated.data).filter(([key]) =>
					paramsUpdateList.includes(key as keyof DiscountEntity),
				),
			) as Partial<DiscountEntity>),
		};

		await getDiscountRepository().save(updatedEntity);

		res.locals.output.message(lang('discount.success.update'));
		res.locals.output.data(updatedEntity);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await getDiscountRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('discount.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await getDiscountRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('discount.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<CarrierValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		const [entries, total] = await getDiscountRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterBy('scope', validated.data.filter.scope)
			.filterBy('reason', validated.data.filter.reason)
			.filterBy('type', validated.data.filter.type)
			.filterByRange(
				'start_at',
				validated.data.filter.start_at_start,
				validated.data.filter.start_at_end,
			)
			.filterByTerm(validated.data.filter.term)
			.withDeleted(
				this.policy.allowDeleted(res.locals.auth) &&
					validated.data.filter.is_deleted,
			)
			.orderBy(validated.data.order_by, validated.data.direction)
			.pagination(validated.data.page, validated.data.limit)
			.all(true);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.locals.output);
	});
}

export function createDiscountController(deps: {
	policy: PolicyAbstract;
	validator: IDiscountValidator;
	cache: CacheProvider;
	discountService: IDiscountService;
}) {
	return new DiscountController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.discountService,
	);
}

export const discountController = createDiscountController({
	policy: discountPolicy,
	validator: discountValidator,
	cache: cacheProvider,
	discountService: discountService,
});
