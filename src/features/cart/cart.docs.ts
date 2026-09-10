import { Configuration } from '@/config/settings.config';
import type { cartController } from '@/features/cart/cart.controller';
import { CartStatusEnum } from '@/features/cart/cart.entity';
import {
	getCartEntityMock,
	getCartPricingMock,
} from '@/features/cart/cart.mock';
import { OrderByEnum } from '@/features/cart/cart.validator';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

const entitySample = getCartEntityMock() as unknown as Record<string, unknown>;

const readSample: Record<string, unknown> = {
	...entitySample,
	pricing: getCartPricingMock(),
};

/**
 * The note every cart response needs, because the shape is unusual for this API: the money in it
 * is computed, not stored.
 */
export const PRICING_NOTE =
	'`pricing` is resolved against the catalog at read time and is stored nowhere - a cart holds references, not prices, so the figures here are what the lines would cost right now rather than what they cost when the shopper added them. A line carrying `issue` cannot be bought and contributes nothing to the totals';

/**
 * The dashboard half: read-only, plus removal. There is no create and no update - a cart is the
 * shopper's own working state, and editing one from the back office would change the record of
 * what they chose.
 */
export const docs: Record<keyof typeof cartController, ApiInputDocumentation> =
	{
		read: helperApiInputDocumentation({
			description: 'Get cart details',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Cart details, with its lines priced as of now',
				dataSample: readSample,
			},
			withAuthErrors: true,
			withErrors: [404],
			request: {
				notes: `Soft-deleted carts are returned only to a caller whose role allows it. ${PRICING_NOTE}`,
				params: {
					id: {
						type: 'number',
						required: true,
					},
				},
			},
		}),

		find: helperApiInputDocumentation({
			description: 'List carts',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Paginated carts',
				dataSample: {
					entries: [entitySample],
					pagination: { page: 1, limit: 20, total: 1 },
				},
			},
			withAuthErrors: true,
			withErrors: [422],
			request: {
				notes: "The listing carries the rows only - lines are not priced here, since doing it per row would re-read the catalog once per cart on the page. Read one cart for that. `token` is not a filter: it is the guest's credential, and searching by it would turn this into a way to open any cart",
				query: {
					page: {
						type: 'number',
						required: false,
						condition: 'defaults to 1',
					},
					limit: {
						type: 'number',
						required: false,
						condition: `defaults to ${Configuration.get('filter.limit')}`,
					},
					order_by: {
						type: 'string',
						required: false,
						condition: `one of ${Object.values(OrderByEnum).join(', ')}`,
					},
					direction: {
						type: 'string',
						required: false,
						condition: `one of ${Object.values(OrderDirectionEnum).join(', ')}`,
					},
					'filter[status]': {
						type: 'string',
						required: false,
						condition: `one of ${Object.values(CartStatusEnum).join(', ')}`,
					},
					'filter[user_id]': {
						type: 'number',
						required: false,
					},
					'filter[order_id]': {
						type: 'number',
						required: false,
						condition: 'which cart an order came from',
					},
					'filter[is_deleted]': {
						type: 'boolean',
						required: false,
						condition:
							'defaults to false; a role that does not allow deleted rows gets none whatever this says',
					},
					'filter[currency]': {
						type: 'string',
						required: false,
						condition: 'three-letter code',
					},
				},
			},
		}),

		delete: helperApiInputDocumentation({
			description: 'Delete cart',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Cart removed',
				withMessage: true,
			},
			withAuthErrors: true,
			withErrors: [404],
			request: {
				notes: 'Soft. The lines go with it through the foreign key, and `restore` brings both back',
				params: {
					id: {
						type: 'number',
						required: true,
					},
				},
			},
		}),

		restore: helperApiInputDocumentation({
			description: 'Restore cart',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Cart restored',
				withMessage: true,
			},
			withAuthErrors: true,
			withErrors: [404],
			request: {
				params: {
					id: {
						type: 'number',
						required: true,
					},
				},
			},
		}),
	};
