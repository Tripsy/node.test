import type { Request, Response } from 'express';
import dataSource from '@/config/data-source.config';
import { lang } from '@/config/i18n.setup';
import type { CarrierValidatorFindDto } from '@/features/carrier/carrier.validator';
import ClientEntity, {
	type ClientIdentityData,
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import { clientPolicy } from '@/features/client/client.policy';
import { getClientRepository } from '@/features/client/client.repository';
import {
	ClientCreateValidator,
	ClientFindValidator,
	ClientUpdateValidator,
	paramsUpdateList,
} from '@/features/client/client.validator';
import { BaseController } from '@/lib/abstracts/controller.abstract';
import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
import { BadRequestError, CustomError, NotFoundError } from '@/lib/exceptions';
import asyncHandler from '@/lib/helpers/async.handler';
import {
	type CacheProvider,
	cacheProvider,
} from '@/lib/providers/cache.provider';

class ClientController extends BaseController {
	constructor(
		private policy: PolicyAbstract,
		private validator: IClientValidator,
		private cache: CacheProvider,
		private clientService: IClientService,
	) {
		super();
	}
	public create = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canCreate(res.locals.auth);

		// Validate against the schema
		const validated = await ClientCreateValidator().safeParseAsync(
			req.body,
		);

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const clientIdentityData: ClientIdentityData =
			validated.data.client_type === ClientTypeEnum.COMPANY
				? {
						client_type: ClientTypeEnum.COMPANY,
						company_name: validated.data.company_name,
						company_cui: validated.data.company_cui,
						company_reg_com: validated.data.company_reg_com,
					}
				: {
						client_type: ClientTypeEnum.PERSON,
						person_cnp: validated.data.person_cnp,
					};

		const isDuplicate =
			await getClientRepository().isDuplicateIdentity(clientIdentityData);

		if (isDuplicate) {
			throw new CustomError(409, lang('client.error.already_exists'));
		}

		const client = new ClientEntity();
		Object.assign(client, validated.data);
		client.status = ClientStatusEnum.ACTIVE;

		const entry: ClientEntity = await getClientRepository().save(client);

		res.locals.output.data(entry);
		res.locals.output.message(lang('client.success.create'));

		res.status(201).json(res.locals.output);
	});

	public read = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRead(res.locals.auth);

		const cacheKey = this.cache.buildKey(
			ClientEntity.NAME,
			res.locals.validated.id,
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
				.where('c.id = :id', { id: res.locals.validated.id })
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

		const client = await getClientRepository()
			.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		// Validate against the schema
		const validated = await ClientUpdateValidator().safeParseAsync({
			client_type: req.body.client_type ?? client.client_type,
			...req.body, // client_type (DB value will be overwritten by the one in the body if it exists)
		});

		if (!validated.success) {
			res.locals.output.errors(validated.error.issues);

			throw new BadRequestError();
		}

		const clientIdentityData: ClientIdentityData =
			validated.data.client_type === ClientTypeEnum.COMPANY
				? {
						client_type: ClientTypeEnum.COMPANY,
						company_name: validated.data.company_name,
						company_cui: validated.data.company_cui,
						company_reg_com: validated.data.company_reg_com,
					}
				: {
						client_type: ClientTypeEnum.PERSON,
						person_cnp: validated.data.person_cnp,
					};

		const isDuplicate = await getClientRepository().isDuplicateIdentity(
			clientIdentityData,
			res.locals.validated.id,
		);

		if (isDuplicate) {
			throw new CustomError(409, lang('client.error.already_exists'));
		}

		const updatedEntity: Partial<ClientEntity> = {
			id: client.id,
			...(Object.fromEntries(
				Object.entries(validated.data).filter(([key]) =>
					paramsUpdateList.includes(key as keyof ClientEntity),
				),
			) as Partial<ClientEntity>),
		};

		await getClientRepository().save(updatedEntity);

		res.locals.output.message(lang('client.success.update'));
		res.locals.output.data(updatedEntity);

		res.json(res.locals.output);
	});

	public delete = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canDelete(res.locals.auth);

		await getClientRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.delete();

		res.locals.output.message(lang('client.success.delete'));

		res.json(res.locals.output);
	});

	public restore = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canRestore(res.locals.auth);

		await getClientRepository()
			.createQuery()
			.filterById(res.locals.validated.id)
			.restore();

		res.locals.output.message(lang('client.success.restore'));

		res.json(res.locals.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		this.policy.canFind(res.locals.auth);

		const data = this.validate<CarrierValidatorFindDto>(
			this.validator.find(),
			req.query,
			res,
		);

		const [entries, total] = await getClientRepository()
			.createQuery()
			.filterById(validated.data.filter.id)
			.filterBy('client_type', validated.data.filter.client_type)
			.filterByStatus(validated.data.filter.status)
			.filterByRange(
				'created_at',
				validated.data.filter.create_date_start,
				validated.data.filter.create_date_end,
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

	public statusUpdate = asyncHandler(async (_req: Request, res: Response) => {
		this.policy.canUpdate(res.locals.auth);

		const client = await getClientRepository()
			.createQuery()
			.select(['id', 'status'])
			.filterById(res.locals.validated.id)
			.firstOrFail();

		if (client.status === res.locals.validated.status) {
			throw new BadRequestError(
				lang('client.error.status_unchanged', {
					status: res.locals.validated.status,
				}),
			);
		}

		client.status = res.locals.validated.status;

		await getClientRepository().save(client);

		res.locals.output.message(lang('client.success.status_update'));

		res.json(res.locals.output);
	});
}

export function createClientController(deps: {
	policy: PolicyAbstract;
	validator: IClientValidator;
	cache: CacheProvider;
	clientService: IClientService;
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
