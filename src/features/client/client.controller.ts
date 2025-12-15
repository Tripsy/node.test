import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import CustomError from '@/exceptions/custom.error';
import ClientEntity, {
	type ClientIdentityData,
	ClientStatusEnum,
	ClientTypeEnum,
} from '@/features/client/client.entity';
import ClientPolicy from '@/features/client/client.policy';
import ClientRepository, {
	ClientQuery,
} from '@/features/client/client.repository';
import {
	ClientCreateValidator,
	ClientFindValidator,
	ClientUpdateValidator,
	paramsUpdateList,
} from '@/features/client/client.validator';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class ClientController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = await ClientCreateValidator.safeParseAsync(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

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
			await ClientRepository.isDuplicateIdentity(clientIdentityData);

		if (isDuplicate) {
			throw new CustomError(409, lang('client.error.already_exists'));
		}

		const client = new ClientEntity();
		Object.assign(client, validated.data);
		client.status = ClientStatusEnum.ACTIVE;

		// Set `contextData` for usage in subscriber
		client.contextData = {
			auth_id: policy.getUserId(),
		};

		const entry: ClientEntity = await ClientRepository.save(client);

		res.output.data(entry);
		res.output.message(lang('client.success.create'));

		res.status(201).json(res.output);
	});

	public read = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin, operator with permission)
		policy.read('client');

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			ClientQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);
		const client = await cacheProvider.get(cacheKey, async () => {
			return ClientRepository.createQuery()
				.filterById(res.locals.validated.id)
				.withDeleted(policy.allowDeleted())
				.firstOrFail();
		});

		res.output.meta(cacheProvider.isCached, 'isCached');
		res.output.data(client);

		res.json(res.output);
	});

	public update = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin or operator with permission)
		policy.update();

		// Validate against the schema
		const validated = await ClientUpdateValidator.safeParseAsync(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const client = await ClientRepository.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

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

		const isDuplicate = await ClientRepository.isDuplicateIdentity(
			clientIdentityData,
			res.locals.validated.id,
		);

		if (isDuplicate) {
			throw new CustomError(409, lang('client.error.already_exists'));
		}

		const existingClientQuery = ClientRepository.createQuery()
			.filterBy('id', res.locals.validated.id, '!=')
			.filterBy('client_type', validated.data.client_type);

		if (validated.data.client_type === ClientTypeEnum.COMPANY) {
			existingClientQuery.filterAny([
				{
					column: 'company_name',
					value: validated.data.company_name,
					operator: '=',
				},
				{
					column: 'company_cui',
					value: validated.data.company_cui,
					operator: '=',
				},
				{
					column: 'company_reg_com',
					value: validated.data.company_reg_com,
					operator: '=',
				},
			]);
		} else {
			existingClientQuery.filterAny([
				{
					column: 'person_name',
					value: validated.data.person_name,
					operator: '=',
				},
				{
					column: 'person_cnp',
					value: validated.data.person_cnp,
					operator: '=',
				},
			]);
		}

		const existingClient = await existingClientQuery.first();

		if (existingClient) {
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

		// Set `contextData` for usage in subscriber
		updatedEntity.contextData = {
			auth_id: policy.getUserId(),
		};

		await ClientRepository.save(updatedEntity);

		res.output.message(lang('client.success.update'));
		res.output.data(updatedEntity);

		res.json(res.output);
	});

	public delete = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin or operator with permission)
		policy.delete();

		await ClientRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.delete();

		res.output.message(lang('client.success.delete'));

		res.json(res.output);
	});

	public restore = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin or operator with permission)
		policy.restore();

		await ClientRepository.createQuery()
			.filterById(res.locals.validated.id)
			.setContextData({
				auth_id: policy.getUserId(),
			})
			.restore();

		res.output.message(lang('client.success.restore'));

		res.json(res.output);
	});

	public find = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin or operator with permission)
		policy.find();

		// Validate against the schema
		const validated = ClientFindValidator.safeParse(req.query);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const [entries, total] = await ClientRepository.createQuery()
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

	public statusUpdate = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin or operator with permission)
		policy.update();

		const client = await ClientRepository.createQuery()
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

		// Set `contextData` for usage in subscriber
		client.contextData = {
			auth_id: policy.getUserId(),
		};

		await ClientRepository.save(client);

		res.output.message(lang('client.success.status_update'));

		res.json(res.output);
	});
}

export default new ClientController();
