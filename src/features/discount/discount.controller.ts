import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import DiscountEntity from '@/features/discount/discount.entity';
import DiscountPolicy from '@/features/discount/discount.policy';
import {
	DiscountQuery,
	getDiscountRepository,
} from '@/features/discount/discount.repository';
import {
	DiscountCreateValidator,
	DiscountFindValidator,
	DiscountUpdateValidator,
	paramsUpdateList,
} from '@/features/discount/discount.validator';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class DiscountController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = DiscountCreateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

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
		const policy = new DiscountPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			DiscountQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);

		const discount = await cacheProvider.get(cacheKey, async () => {
			return getDiscountRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.locals.output.meta(cacheProvider.isCached, 'isCached');
		res.locals.output.data(discount);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = DiscountUpdateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

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
		const policy = new DiscountPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		await getDiscountRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('discount.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new DiscountPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.restore();

		await getDiscountRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('discount.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = DiscountFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

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
				policy.allowDeleted() && validated.data.filter.is_deleted,
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

export default new DiscountController();
