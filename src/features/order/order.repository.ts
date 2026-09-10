import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import OrderEntity from '@/features/order/order.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class OrderQuery extends RepositoryAbstract<OrderEntity> {
	constructor(repository: Repository<OrderEntity>) {
		super(repository, OrderEntity.NAME);
	}

	filterByClient(clientId?: number | null): this {
		this.filterBy('client_id', clientId);

		return this;
	}

	/**
	 * The document reference as a person cites it - "ORD-1183". Both halves are needed: the number
	 * is only unique within its series, which is what `IDX_order_ref` is keyed on.
	 */
	filterByReference(code?: string | null, number?: number | null): this {
		this.filterBy('ref_code', code);
		this.filterBy('ref_number', number);

		return this;
	}
}

export const getOrderRepository = () =>
	dataSource.getRepository(OrderEntity).extend({
		createQuery() {
			return new OrderQuery(this);
		},
	});
