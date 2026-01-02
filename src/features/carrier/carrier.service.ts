import type { Repository } from 'typeorm/repository/Repository';
import { lang } from '@/config/i18n.setup';
import type CarrierEntity from '@/features/carrier/carrier.entity';
import {
	getCarrierRepository,
	type CarrierQuery,
} from '@/features/carrier/carrier.repository';
import {
	paramsUpdateList,
	type CarrierValidatorCreateDto,
	type CarrierValidatorFindDto,
	type CarrierValidatorUpdateDto,
} from '@/features/carrier/carrier.validator';
import type {
	IEntityCreateService,
	IEntityDeleteService,
	IEntityFindService,
	IEntityRestoreService,
	IEntityUpdateService,
} from '@/lib/abstracts/service.abstract';
import { BadRequestError, CustomError } from '@/lib/exceptions';

export interface ICarrierService
	extends IEntityCreateService<CarrierEntity>,
		IEntityUpdateService<CarrierEntity>,
		IEntityDeleteService<CarrierEntity>,
		IEntityRestoreService<CarrierEntity>,
		IEntityFindService<CarrierEntity, CarrierValidatorFindDto> {
	checkIfExistByEmail(
		email: string,
		withDeleted: boolean,
		excludeId?: number,
	): Promise<CarrierEntity | null>;
}

class CarrierService implements ICarrierService {
	constructor(
		private carrierRepository: Repository<CarrierEntity> & {
			createQuery(): CarrierQuery;
		},
	) {}

	public checkIfExistByName(
		name: string,
		withDeleted: boolean,
		excludeId?: number,
	) {
		const q = this.carrierRepository
			.createQuery()
            .filterBy('name', name)
			.withDeleted(withDeleted);

		if (excludeId) {
			q.filterBy('id', excludeId, '!=');
		}

		return q.first();
	}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(data: CarrierValidatorCreateDto): Promise<CarrierEntity> {
		const existingCarrier = await this.checkIfExistByName(data.name, true);

		if (existingCarrier) {
			throw new CustomError(409, lang('carrier.error.name_already_used'));
		}

        // carrier.name = validated.data.name;
        // carrier.website = validated.data.website ?? null;
        // carrier.phone = validated.data.phone ?? null;
        // carrier.email = validated.data.email ?? null;
        // carrier.notes = validated.data.notes ?? null;

		const entry = {
			name: data.name,
            website: data.website,
            phone: data.phone,
            email: data.email,
            notes: data.notes,

			...(data.role === CarrierRoleEnum.OPERATOR &&
				data.operator_type && {
					operator_type: data.operator_type,
				}),

			...(data.language && {
				language: data.language,
			}),
		};

		return this.carrierRepository.save(entry);
	}

	/**
	 * @description Update any carrier data
	 */
	public update(data: Partial<CarrierEntity> & { id: number }) {
		return this.carrierRepository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		withDeleted: boolean,
		data: CarrierValidatorUpdateDto,
	) {
		const carrier = await this.findById(id, withDeleted);

		if (data.email) {
			const existingCarrier = await this.checkIfExistByEmail(
				data.email,
				true,
				id,
			);

			if (existingCarrier) {
				throw new CustomError(
					409,
					lang('carrier.error.email_already_used'),
				);
			}
		}

		if (data.password || data.email !== carrier.email) {
			await this.accountTokenService.removeAccountTokenForCarrier(carrier.id); // Note: Removes all account tokens for the carrier
		}

		const updateData = {
			...Object.fromEntries(
				paramsUpdateList
					.filter((key) => key in data)
					.map((key) => [key, data[key as keyof typeof data]]),
			),
			id,
		};

		return this.update(updateData);
	}

	public async updateStatus(
		id: number,
		status: CarrierStatusEnum,
		withDeleted: boolean,
	) {
		const carrier = await this.findById(id, withDeleted);

		if (carrier.status === status) {
			throw new BadRequestError(
				lang('carrier.error.status_unchanged', { status }),
			);
		}

		carrier.status = status;

		return this.carrierRepository.save(carrier);
	}

	public async delete(id: number) {
		await this.carrierRepository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.carrierRepository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean) {
		return this.carrierRepository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByFilter(data: CarrierValidatorFindDto, withDeleted: boolean) {
		return this.carrierRepository
			.createQuery()
			.filterById(data.filter.id)
			.filterByStatus(data.filter.status)
			.filterBy('role', data.filter.role)
			.filterByRange(
				'created_at',
				data.filter.create_date_start,
				data.filter.create_date_end,
			)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const carrierService = new CarrierService(
	getCarrierRepository(),
);
