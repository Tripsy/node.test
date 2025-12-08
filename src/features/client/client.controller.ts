import type { Request, Response } from 'express';
import { lang } from '@/config/i18n.setup';
import BadRequestError from '@/exceptions/bad-request.error';
import CustomError from '@/exceptions/custom.error';
import AccountTokenRepository from '@/features/account/account-token.repository';
import ClientEntity from '@/features/client/client.entity';
import ClientPolicy from '@/features/client/client.policy';
import ClientRepository, {
	ClientQuery,
} from '@/features/client/client.repository';
import asyncHandler from '@/helpers/async.handler';
import { getCacheProvider } from '@/providers/cache.provider';

class ClientController {
	public create = asyncHandler(async (req: Request, res: Response) => {
		const policy = new ClientPolicy(req);

		// Check permission (admin or operator with permission)
		policy.create();

		// Validate against the schema
		const validated = ClientCreateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const existingClient = await ClientRepository.createQuery()
			.filterByEmail(validated.data.email)
			.withDeleted(policy.allowDeleted())
			.first();

		if (existingClient) {
			throw new CustomError(409, lang('client.error.email_already_used'));
		}

		const client = new ClientEntity();
		client.client_type = validated.data.client_type;
		client.status = validated.data.status;
		client.company_name = validated.data.company_name;
		client.company_cui = validated.data.company_cui;
		client.company_reg_com = validated.data.company_reg_com;
		client.person_name = validated.data.person_name;
		client.person_cnp = validated.data.person_cnp;
		client.iban = validated.data.iban;
		client.bank_name = validated.data.bank_name;
		client.contact_name = validated.data.contact_name;
		client.contact_email = validated.data.contact_email;
		client.contact_phone = validated.data.contact_phone;
		client.address_country = validated.data.address_country;
		client.address_county = validated.data.address_county;
		client.address_city = validated.data.address_city;
		client.address_street = validated.data.address_street;
		client.address_postal_code = validated.data.address_postal_code;
		client.notes = validated.data.notes;

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

		// Check permission (admin, operator with permission or owner)
		policy.read('user', req.user?.id); // TODO

		const cacheProvider = getCacheProvider();

		const cacheKey = cacheProvider.buildKey(
			ClientQuery.entityAlias,
			res.locals.validated.id,
			'read',
		);
		const client = await cacheProvider.get(cacheKey, async () => {
			return (
				ClientRepository.createQuery()
					// .select(['id', 'name', 'email', 'status', 'created_at', 'updated_at'])
					// .addSelect(['password'])
					.filterById(res.locals.validated.id)
					.withDeleted(policy.allowDeleted())
					.firstOrFail()
			);
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
		const validated = ClientUpdateValidator.safeParse(req.body);

		if (!validated.success) {
			res.output.errors(validated.error.errors);

			throw new BadRequestError();
		}

		const client = await ClientRepository.createQuery()
			.select(paramsUpdateList)
			.filterById(res.locals.validated.id)
			.firstOrFail();

		const existingClient = await ClientRepository.createQuery()
			.filterBy('id', res.locals.validated.id, '!=')
			.filterByEmail(validated.data.email)
			.first();

		// Return error if email already in use by another account
		if (existingClient) {
			throw new CustomError(409, lang('client.error.email_already_used'));
		}

		// Remove all account tokens
		if (validated.data.password || validated.data.email !== client.email) {
			await AccountTokenRepository.createQuery()
				.filterBy('client_id', client.id)
				.delete(false, true);
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
		res.output.data(client);

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
			.filterByStatus(validated.data.filter.status)
			.filterBy('role', validated.data.filter.role)
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
