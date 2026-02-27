import type { DeepPartial } from 'typeorm';
import { lang } from '@/config/i18n.setup';
import {BadRequestError, CustomError} from '@/exceptions';
import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import { getCashFlowRepository } from '@/features/cash-flow/cash-flow.repository';
import {
	type CashFlowValidator,
	paramsUpdateList,
} from '@/features/cash-flow/cash-flow.validator';
import type { ValidatorOutput } from '@/shared/abstracts/validator.abstract';
import {CashFlowStatusEnum} from "@/features/cash-flow/cash-flow.entity";

export class CashFlowService {
	constructor(private repository: ReturnType<typeof getCashFlowRepository>) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<CashFlowValidator, 'create'>,
	): Promise<CashFlowEntity> {
		const existingCashFlow = await this.findByName(data.name, true);

		if (existingCashFlow) {
			throw new CustomError(
				409,
				lang('cash-flow.error.name_already_used'),
			);
		}

		const entry = {
			name: data.name,
			website: data.website,
			phone: data.phone,
			email: data.email,
			notes: data.notes,
		};

		return this.repository.save(entry);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<CashFlowEntity> & { id: number },
	): Promise<CashFlowEntity> {
		return this.repository.save(data);
	}

	/**
	 * @description Used in `update` method from controller; `data` is filtered by `paramsUpdateList` - which is declared in validator
	 */
	public async updateData(
		id: number,
		data: ValidatorOutput<CashFlowValidator, 'update'>,
		withDeleted: boolean = true,
	) {
		if (data.name) {
			const existingCashFlow = await this.findByName(
				data.name,
				withDeleted,
				id,
			);

			if (existingCashFlow) {
				throw new CustomError(
					409,
					lang('cash-flow.error.name_already_used'),
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

	public async updateStatus(
		id: number,
		newStatus: CashFlowStatusEnum,
		withDeleted: boolean,
	): Promise<void> {
		const entry = await this.findById(id, withDeleted);

		if (entry.status === newStatus) {
			throw new BadRequestError(
				lang('cash-flow.error.status_unchanged', { status: newStatus }),
			);
		}

		entry.status = newStatus;

		await this.repository.save(entry);
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<CashFlowEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	public findByName(name: string, withDeleted: boolean, excludeId?: number) {
		const q = this.repository
			.createQuery()
			.filterBy('name', name)
			.withDeleted(withDeleted);

		if (excludeId) {
			q.filterBy('id', excludeId, '!=');
		}

		return q.first();
	}

	public findByFilter(
		data: ValidatorOutput<CashFlowValidator, 'find'>,
		withDeleted: boolean,
	) {
		return this.repository
			.createQuery()
			.filterById(data.filter.id)
			.filterByTerm(data.filter.term)
			.withDeleted(withDeleted && data.filter.is_deleted)
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const cashFlowService = new CashFlowService(getCashFlowRepository());
