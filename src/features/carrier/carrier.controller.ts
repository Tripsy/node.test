import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import CarrierEntity from '@/features/carrier/carrier.entity';
import CarrierPolicy from '@/features/carrier/carrier.policy';
import { getCarrierRepository } from '@/features/carrier/carrier.repository';
import {
	CarrierCreateValidator,
	CarrierFindValidator,
	CarrierUpdateValidator,
	paramsUpdateList,
} from '@/features/carrier/carrier.validator';
import { BadRequestError, CustomError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import { getCacheProvider } from '@/lib/providers/cache.provider';

class CarrierController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CarrierPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = CarrierCreateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const existingCarrier = await getCarrierRepository()
			.createQuery()
			.filterBy('name', validated.data.name)
			.withDeleted(policy.allowDeleted())
			.first();

		if (existingCarrier) {
			throw new CustomError(409, lang('carrier.error.name_already_used'));
		}

		const carrier = new CarrierEntity();
		carrier.name = validated.data.name;
		carrier.website = validated.data.website ?? null;
		carrier.phone = validated.data.phone ?? null;
		carrier.email = validated.data.email ?? null;
		carrier.notes = validated.data.notes ?? null;

		const entry: CarrierEntity = await getCarrierRepository().save(carrier);

		res.locals.output.data(entry);
		res.locals.output.message(lang('carrier.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new CarrierPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.read();

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			CarrierEntity.NAME,
			res.locals.validated.id,
			'read',
		);

		const carrier = await cacheProvider.get(cacheKey, async () => {
			return getCarrierRepository()
				.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.locals.output.meta(cacheProvider.isCached, 'isCached');
		res.locals.output.data(carrier);

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CarrierPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = CarrierUpdateValidator().safeParse(req.body);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const carrier = await getCarrierRepository()
			.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		// Check name uniqueness only if the name is being updated
		if (validated.data.name) {
			const existingCarrier = await getCarrierRepository()
				.createQuery()
				.filterBy('id', res.locals.validated.id, '!=')
				.filterBy('name', validated.data.name)
				.withDeleted(policy.allowDeleted())
				.first();

			// Return error if name already in use by another carrier
			if (existingCarrier) {
				throw new CustomError(
					409,
					lang('carrier.error.name_already_used'),
				);
			}
		}

		const updatedEntity: Partial<CarrierEntity> = {
			id: carrier.id,
			...(Object.fromEntries(
				Object.entries(validated.data).filter(([key]) =>
					paramsUpdateList.includes(key as keyof CarrierEntity),
				),
			) as Partial<CarrierEntity>),
		};

		await getCarrierRepository().save(updatedEntity);

		res.locals.output.message(lang('carrier.success.update'));
		res.locals.output.data(updatedEntity);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new CarrierPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.delete();

		await getCarrierRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('carrier.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		const policy = new CarrierPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.restore();

		await getCarrierRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('carrier.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new CarrierPolicy(res.locals.auth);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = CarrierFindValidator().safeParse(req.query);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const [entries, total] = await getCarrierRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
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

export default new CarrierController();
