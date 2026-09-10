import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import CartEntity from '@/features/cart/cart.entity';
import CartItemEntity from '@/features/cart/cart-item.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class CartQuery extends RepositoryAbstract<CartEntity> {
	constructor(repository: Repository<CartEntity>) {
		super(repository, CartEntity.NAME);
	}
}

export class CartItemQuery extends RepositoryAbstract<CartItemEntity> {
	constructor(repository: Repository<CartItemEntity>) {
		super(repository, CartItemEntity.NAME);
	}
}

export const getCartRepository = () =>
	dataSource.getRepository(CartEntity).extend({
		createQuery() {
			return new CartQuery(this);
		},
	});

export const getCartItemRepository = () =>
	dataSource.getRepository(CartItemEntity).extend({
		createQuery() {
			return new CartItemQuery(this);
		},
	});
