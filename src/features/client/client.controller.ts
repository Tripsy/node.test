import type { Request, Response } from 'express';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import ClientEntity, { ClientTypeEnum } from '@/features/client/client.entity';
import { clientPolicy } from '@/features/client/client.policy';
import {
	type ClientService,
	clientService,
} from '@/features/client/client.service';
import {
	type ClientValidator,
	type ClientValidatorCreateDto,
	type ClientValidatorFindDto,
	type ClientValidatorUpdateDto,
	clientValidator,
} from '@/features/client/client.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { NotFoundError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class ClientController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: ClientValidator,
		private cache: CacheProvider,
		private clientService: ClientService,
	) {
		super();
	}
	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		const data = this.validate<ClientValidatorCreateDto>(
			this.validator.create(),
			req.body,
			res,
		);

		const entry = await this.clientService.create(data);

		res.locals.output.data(entry);
		res.locals.output.message(lang('client.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			ClientEntity.NAME,
			res.locals.id,
			'read',
		);

		const client = await this.cache.get(cacheKey, async () => {
			const result = await dataSource
				.createQueryBuilder()
				.select([
					'c.*',
					'pcoCountry.name AS address_country',
					'preRegion.name AS address_region',
					'pciCity.name AS address_city',
				])
				.from('client', 'c')
				// Address country
				.leftJoin('place', 'pco', 'pco.id = c.address_country')
				.leftJoin(
					'place_content',
					'pcoCountry',
					'pcoCountry.place_id = pco.id AND pcoCountry.language = :language',
					{ language: res.locals.lang },
				)
				// Address region
				.leftJoin('place', 'pre', 'pre.id = c.address_region')
				.leftJoin(
					'place_content',
					'preRegion',
					'preRegion.place_id = pre.id AND preRegion.language = :language',
					{ language: res.locals.lang },
				)
				// Address city
				.leftJoin('place', 'pci', 'pci.id = c.address_city')
				.leftJoin(
					'place_content',
					'pciCity',
					'pciCity.place_id = pci.id AND pciCity.language = :language',
					{ language: res.locals.lang },
				)
				.where('c.id = :id', { id: res.locals.id })
				.getRawOne();

			if (!result) {
				throw new NotFoundError(lang('client.error.not_found'));
			}

			if (result.client_type === ClientTypeEnum.COMPANY) {
				delete result.person_name;
				delete result.person_cnp;

				return result;
			} else {
				delete result.company_name;
				delete result.company_cui;
				delete result.company_reg_com;

				return result;
			}
		});

		res.locals.output.data(client);
		res.locals.output.meta(this.cache.isCached, 'isCached');

		res.json(res.locals.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const client = await this.clientService.findById(
			res.locals.validated.id,
			this.policy.allowDeleted(res.locals.auth),
		);

		const data = await this.validateAsync<ClientValidatorUpdateDto>(
			this.validator.update(),
			{
				client_type: req.body.client_type ?? client.client_type,
				...req.body, // client_type (DB value will be overwritten by the one in the body if it exists)
			},
			res,
		);

		const entry = await this.clientService.updateData(
			res.locals.validated.id,
			data,
		);

		res.locals.output.message(lang('client.success.update'));
		res.locals.output.data(entry);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await this.clientService.delete(res.locals.validated.id);

		res.locals.output.message(lang('client.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await this.clientService.restore(res.locals.validated.id);

		res.locals.output.message(lang('client.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<ClientValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		const [entries, total] = await this.clientService.findByFilter(
			data,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});

	public statusUpdate = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		await this.clientService.updateStatus(
			res.locals.validated.id,
			res.locals.validated.status,
			this.policy.allowDeleted(res.locals.auth),
		);

		res.locals.output.message(lang('client.success.status_update'));

		res.json(res.locals.output);
	});
}

export function createClientController(deps: {
	policy: PolicyAbstract;
	validator: ClientValidator;
	cache: CacheProvider;
	clientService: ClientService;
}) {
	return new ClientController(
		deps.policy,
		deps.validator,
		deps.cache,
		deps.clientService,
	);
}

export const clientController = createClientController({
	policy: clientPolicy,
	validator: clientValidator,
	cache: cacheProvider,
	clientService: clientService,
});
