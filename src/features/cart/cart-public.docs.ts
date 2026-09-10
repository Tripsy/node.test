import { PRICING_NOTE } from '@/features/cart/cart.docs';
import {
	getCartEntityMock,
	getCartPricingMock,
} from '@/features/cart/cart.mock';
import {
	CART_NOTES_MAX,
	CART_OPTIONS_MAX,
	CART_QUANTITY_MAX,
	paramsItemUpdateList,
} from '@/features/cart/cart.validator';
import type { cartPublicController } from '@/features/cart/cart-public.controller';
import { CART_TOKEN_HEADER } from '@/features/cart/cart-public.controller';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';

/**
 * What the storefront gets back from every cart call: the row plus its priced lines. The same
 * shape on a write as on a read, because the totals move on any change - a discount conditioned on
 * the basket value can switch on when one line is added - so returning only the line that changed
 * would leave the client guessing at the total.
 */
const cartSample: Record<string, unknown> = (() => {
	const { deleted_at, ...rest } = getCartEntityMock() as unknown as Record<
		string,
		unknown
	>;

	return { ...rest, pricing: getCartPricingMock() };
})();

const TOKEN_NOTE = `A guest names their cart with the \`${CART_TOKEN_HEADER}\` header, whose value comes from the \`token\` field of any cart response - it is returned in the body rather than set as a cookie, matching how this API hands out its access token. A signed-in caller is addressed by their account instead and the header is ignored: one live cart per account, so a stale handle from another device cannot write past it. Signing in with a guest cart folds it into the account's own, summing the quantities on lines both held`;

/**
 * The storefront half. No permission, and no account except at checkout - a guest filling a basket
 * is the case this feature exists for.
 */
export const docs: Record<
	keyof typeof cartPublicController,
	ApiInputDocumentation
> = {
	read: helperApiInputDocumentation({
		description: 'Get the current cart',
		success: {
			status: 200,
			description: 'The cart and what it currently costs',
			dataSample: cartSample,
		},
		withErrors: [422],
		request: {
			notes: `Creates a cart and returns its \`token\` when the caller has none, so a first page load needs no separate call. Never cached. ${TOKEN_NOTE}. ${PRICING_NOTE}`,
		},
	}),

	addItem: helperApiInputDocumentation({
		description: 'Add a line to the cart',
		success: {
			status: 200,
			description: 'The cart, repriced, with the line added',
			dataSample: cartSample,
			withMessage: true,
		},
		withErrors: [400, 404, 422],
		request: {
			notes: `Adding the same variant with the same options again raises the quantity of the line already holding it rather than creating a second one; the option ids are sorted and de-duplicated first, so the order they are sent in does not matter. A different option set is a different line. This is the only write that may create a cart. ${TOKEN_NOTE}`,
			body: {
				variant_id: {
					type: 'number',
					required: true,
					condition:
						'the purchasable unit; every line names exactly one',
				},
				product_id: {
					type: 'number',
					required: true,
					condition:
						"must be the variant's own product - the pair is held by a composite foreign key, so a mismatch is refused by the database",
				},
				quantity: {
					type: 'number',
					required: true,
					condition: `greater than 0 and at most ${CART_QUANTITY_MAX}; up to two decimals, since a product may be sold by kg or litre`,
				},
				options: {
					type: 'array',
					required: false,
					condition: `product option ids, at most ${CART_OPTIONS_MAX}; they must belong to the product being added`,
				},
				notes: {
					type: 'string',
					required: false,
					condition: `at most ${CART_NOTES_MAX} characters`,
				},
			},
		},
	}),

	updateItem: helperApiInputDocumentation({
		description: 'Change a cart line',
		success: {
			status: 200,
			description: 'The cart, repriced, with the line changed',
			dataSample: cartSample,
			withMessage: true,
		},
		withErrors: [404, 422],
		request: {
			notes: `Only ${paramsItemUpdateList.join(' and ')} may change. The options are not editable - a different option set is a different line, so the client removes and re-adds instead. ${TOKEN_NOTE}`,
			params: {
				id: {
					type: 'number',
					required: true,
					condition:
						"the line id, resolved within the caller's own cart",
				},
			},
			body: {
				quantity: {
					type: 'number',
					required: false,
					condition: `greater than 0 and at most ${CART_QUANTITY_MAX}`,
				},
				notes: {
					type: 'string',
					required: false,
					condition: `at most ${CART_NOTES_MAX} characters`,
				},
			},
		},
	}),

	removeItem: helperApiInputDocumentation({
		description: 'Remove a cart line',
		success: {
			status: 200,
			description: 'The cart, repriced, without the line',
			dataSample: cartSample,
			withMessage: true,
		},
		withErrors: [404, 422],
		request: {
			notes: `The line is deleted outright - what a shopper took out of a basket is not a record anybody keeps. ${TOKEN_NOTE}`,
			params: {
				id: {
					type: 'number',
					required: true,
				},
			},
		},
	}),

	clear: helperApiInputDocumentation({
		description: 'Empty the cart',
		success: {
			status: 200,
			description: 'The cart, now empty',
			dataSample: cartSample,
			withMessage: true,
		},
		withErrors: [404],
		request: {
			notes: `Emptying an already-empty cart succeeds - the caller asked for a state, not for a row to exist. The cart itself survives, so its token stays usable. ${TOKEN_NOTE}`,
		},
	}),

	setCurrency: helperApiInputDocumentation({
		description: 'Reprice the cart into another currency',
		success: {
			status: 200,
			description: 'The cart, repriced into the new currency',
			dataSample: cartSample,
			withMessage: true,
		},
		withErrors: [404, 422],
		request: {
			notes: `One column changes and the whole basket is re-read against the new market, because no line stores money. A currency the catalog carries no price in is not refused here - the affected lines come back with \`issue: no_price\`, which tells the shopper more than a rejection of the code would. ${TOKEN_NOTE}`,
			body: {
				currency: {
					type: 'string',
					required: true,
					condition: 'three-letter ISO code',
				},
			},
		},
	}),

	checkout: helperApiInputDocumentation({
		description: 'Turn the cart into an order',
		withBearerAuth: true,
		success: {
			status: 201,
			description: 'The order the cart became',
			dataSample: {
				order_id: 104,
				ref_code: 'ORD',
				ref_number: 1183,
				status: 'pending',
				issued_at: new Date().toISOString(),
			},
			withMessage: true,
		},
		withAuthErrors: true,
		withErrors: [400, 404, 422],
		request: {
			notes: 'Requires an account: the order names a `client` to invoice, which cannot be chosen for an anonymous caller. Prices are resolved once more here rather than reused from whatever the shopper was last shown, and those are the figures written to the order - so this is the moment they stop moving. An empty cart answers 400, and so does a cart with any line carrying an `issue`. The cart is terminal afterwards: its status becomes `converted`, it names the order, and the next visit starts a new one',
			body: {
				client_id: {
					type: 'number',
					required: true,
					condition: 'who the order is billed to',
				},
				notes: {
					type: 'string',
					required: false,
					condition: `at most ${CART_NOTES_MAX} characters; recorded on the order`,
				},
			},
		},
	}),
};
