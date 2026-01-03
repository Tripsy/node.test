import type { Repository } from 'typeorm/repository/Repository';
import { lang } from '@/config/i18n.setup';
import type CarrierEntity from '@/features/carrier/carrier.entity';
import {
	type CarrierQuery,
	getCarrierRepository,
} from '@/features/carrier/carrier.repository';
import {
	type CarrierValidatorCreateDto,
	type CarrierValidatorFindDto,
	type CarrierValidatorUpdateDto,
	paramsUpdateList,
} from '@/features/carrier/carrier.validator';
import type {
	IEntityCreateService,
	IEntityDeleteService,
	IEntityFindService,
	IEntityRestoreService,
	IEntityUpdateService,
} from '@/lib/abstracts/service.abstract';
import { CustomError } from '@/lib/exceptions';

export interface ICarrierService
	extends IEntityCreateService<CarrierEntity>,
		IEntityUpdateService<CarrierEntity>,
		IEntityDeleteService<CarrierEntity>,
		IEntityRestoreService<CarrierEntity>,
		IEntityFindService<CarrierEntity, CarrierValidatorFindDto> {
    findByName(
        name: string,
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

	public findByName(
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
	public async create(
		data: CarrierValidatorCreateDto,
	): Promise<CarrierEntity> {
		const existingCarrier = await this.findByName(data.name, true);

		if (existingCarrier) {
			throw new CustomError(409, lang('carrier.error.name_already_used'));
		}

		const entry = {
			name: data.name,
			website: data.website,
			phone: data.phone,
			email: data.email,
			notes: data.notes,
		};

		return this.carrierRepository.save(entry);
	}

    public findById(id: number, withDeleted: boolean) {
        return this.carrierRepository
            .createQuery()
            .filterById(id)
            .withDeleted(withDeleted)
            .firstOrFail();
    }

	/**
	 * @description Update any data
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

		if (data.name) {
			const existingCarrier = await this.findByName(
				data.name,
				true,
				id,
			);

			if (existingCarrier) {
				throw new CustomError(
					409,
					lang('carrier.error.name_already_used'),
				);
			}
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

	public async delete(id: number) {
		await this.carrierRepository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.carrierRepository.createQuery().filterById(id).restore();
	}

	public findByFilter(data: CarrierValidatorFindDto, withDeleted: boolean) {
		return this.carrierRepository
			.createQuery()
			.filterById(data.filter.id)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const carrierService = new CarrierService(getCarrierRepository());
