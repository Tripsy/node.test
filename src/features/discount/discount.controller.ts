import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import DiscountEntity from '@/features/discount/discount.entity';
import DiscountPolicy from '@/features/discount/discount.policy';
import DiscountRepository, {
	DiscountQuery,
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
		const policy = new DiscountPolicy(req);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = DiscountCreateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

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

		// Set `contextData` for usage in subscriber
		discount.contextData = {
			auth_id: policy.getUserId(),
		};

		const entry: DiscountEntity = await DiscountRepository.save(discount);

		res.output.data(entry);
		res.output.message(lang('discount.success.create'));

		res.status(201).json(res.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(req);

		// Check permission (admin or operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			DiscountQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);
		const discount = await cacheProvider.get(cacheKey, async () => {
			return DiscountRepository.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.output.meta(cacheProvider.isCached, 'isCached');
		res.output.data(discount);

		res.json(res.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(req);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = DiscountUpdateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const discount = await DiscountRepository.createQuery()
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

		// Set `contextData` for usage in subscriber
		updatedEntity.contextData = {
			auth_id: policy.getUserId(),
		};

		await DiscountRepository.save(updatedEntity);

		res.output.message(lang('discount.success.update'));
		res.output.data(updatedEntity);

		res.json(res.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(req);

		// Check permission (admin or operator with permission)
		policy.delete();

		await DiscountRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.delete();

		res.output.message(lang('discount.success.delete'));

		res.json(res.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(req);

		// Check permission (admin or operator with permission)
		policy.restore();

		await DiscountRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.restore();

		res.output.message(lang('discount.success.restore'));

		res.json(res.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new DiscountPolicy(req);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = DiscountFindValidator.safeParse(req.query);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const [entries, total] = await DiscountRepository.createQuery()
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

		res.output.data({
			entries: entries,
			pagination: {
				page: validated.data.page,
				limit: validated.data.limit,
				total: total,
			},
			query: validated.data,
		});

		res.json(res.output);
	});
}

export default new DiscountController();
