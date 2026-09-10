import { Configuration } from '@/config/settings.config';
import {
	isDirectRun,
	loadIds,
	randomInt,
	randomPick,
	type SeedDefinition,
	type SeedSummary,
} from '@/database/seed/seed.helper';
import { runSeedFile } from '@/database/seed/seed.runner';
import CartEntity, {
	CART_TTL_SECONDS,
	type CartStatus,
	CartStatusEnum,
} from '@/features/cart/cart.entity';
import { normalizeOptions } from '@/features/cart/cart.service';
import CartItemEntity from '@/features/cart/cart-item.entity';
import ProductOptionEntity from '@/features/product/product-option.entity';
import ProductOptionGroupEntity from '@/features/product/product-option-group.entity';
import ProductVariantEntity from '@/features/product/product-variant.entity';
import UserEntity from '@/features/user/user.entity';
import { createFutureDate, createPastDate } from '@/helpers/date.helper';

const TARGET_CARTS = 12;
const MIN_LINES_PER_CART = 1;
const MAX_LINES_PER_CART = 4;

/**
 * `converted` is deliberately absent. That status is only meaningful next to the `order_id` it
 * names, and `order` ships no seed - there are no orders to point at, and a converted cart with a
 * null order would be a state the application never produces. Add the case here the day an order
 * seed exists.
 */
const STATUSES: readonly CartStatus[] = [
	CartStatusEnum.ACTIVE,
	CartStatusEnum.ACTIVE,
	CartStatusEnum.ACTIVE,
	CartStatusEnum.ABANDONED,
];

/**
 * The natural key: `token` is unique, so a deterministic one per index makes a re-run recognize
 * the carts it already wrote. Shaped as a real v4 uuid because the column is `uuid` and Postgres
 * will not take anything else - the randomness is what a seed has to give up, not the format.
 */
function seedToken(index: number): string {
	const tail = index.toString().padStart(12, '0');

	return `00000000-0000-4000-8000-${tail}`;
}

/**
 * Carts in the two states a live table is mostly made of: baskets somebody is still filling, and
 * ones that timed out. Roughly half are attached to a seeded account and the rest are guests,
 * which is the split the merge-at-login path has to cope with.
 */
export const cartSeed: SeedDefinition = {
	name: 'cart',
	run: async ({ manager, random }): Promise<SeedSummary> => {
		const repository = manager.getRepository(CartEntity);
		const itemRepository = manager.getRepository(CartItemEntity);

		const variantRows = await manager
			.getRepository(ProductVariantEntity)
			.find({
				select: { id: true, product_id: true },
				order: { id: 'ASC' },
			});

		const userIds = await loadIds(manager, UserEntity);

		if (variantRows.length === 0) {
			return {
				entity: 'cart',
				alreadyPresent: 0,
				inserted: 0,
				target: 0,
				tableTotal: await repository.count(),
			};
		}

		/*
		 * The options each product offers, keyed by product. A line may only cite options its own
		 * product asks about - nothing in the schema enforces that, since `cart_item.options` is
		 * jsonb, so the seed has to get it right or the pricing pass reports `option_gone` on
		 * rows that were never coherent.
		 */
		const optionRows = await manager
			.getRepository(ProductOptionEntity)
			.createQueryBuilder('option')
			.innerJoin(
				ProductOptionGroupEntity,
				'group',
				'group.id = option.option_group_id',
			)
			.where('option.deleted_at IS NULL')
			.select(['option.id AS id', 'group.product_id AS product_id'])
			.orderBy('option.id', 'ASC')
			.getRawMany<{ id: number; product_id: number }>();

		const optionsByProduct = new Map<number, number[]>();

		for (const row of optionRows) {
			const bucket = optionsByProduct.get(row.product_id) ?? [];

			bucket.push(row.id);
			optionsByProduct.set(row.product_id, bucket);
		}

		const existingTokens = new Set(
			(
				await repository.find({
					select: { token: true },
					withDeleted: true,
				})
			).map((row) => row.token),
		);

		const currency = Configuration.currency();

		let inserted = 0;
		let alreadyPresent = 0;

		for (let index = 0; index < TARGET_CARTS; index++) {
			const token = seedToken(index);

			if (existingTokens.has(token)) {
				alreadyPresent++;

				continue;
			}

			const status = randomPick(random, STATUSES);
			const isMember = userIds.length > 0 && index % 2 === 0;

			const cart = await repository.save(
				repository.create({
					token: token,
					// Every second cart belongs to an account. `UQ_cart_user_active` allows
					// one live cart per user, so an account is reused only once it has been
					// spent on an abandoned one.
					user_id: isMember
						? (userIds[index % userIds.length] ?? null)
						: null,
					status: status,
					order_id: null,
					currency: currency,
					// An abandoned cart expired in the past - that is what made it abandoned.
					expires_at:
						status === CartStatusEnum.ABANDONED
							? createPastDate(randomInt(random, 1, 30) * 86400)
							: createFutureDate(CART_TTL_SECONDS),
				}),
			);

			const lineCount = Math.min(
				randomInt(random, MIN_LINES_PER_CART, MAX_LINES_PER_CART),
				variantRows.length,
			);

			const usedVariants = new Set<number>();
			const lines: Partial<CartItemEntity>[] = [];

			for (let line = 0; line < lineCount; line++) {
				const variant = randomPick(random, variantRows);

				// One line per variant per cart here, rather than relying on the unique
				// index to reject the repeat: a duplicate would only differ by its option
				// set, and the seed has no reason to produce that shape.
				if (usedVariants.has(variant.id)) {
					continue;
				}

				usedVariants.add(variant.id);

				const available =
					optionsByProduct.get(variant.product_id) ?? [];

				// A third of the lines carry an option, so the hashing and the delta
				// arithmetic are both represented rather than assumed.
				const chosen =
					available.length > 0 && randomInt(random, 0, 2) === 0
						? [randomPick(random, available)]
						: [];

				const { options, hash } = normalizeOptions(chosen);

				lines.push({
					cart_id: cart.id,
					variant_id: variant.id,
					product_id: variant.product_id,
					quantity: randomInt(random, 1, 3),
					options: options,
					options_hash: hash,
					notes: null,
				});
			}

			if (lines.length > 0) {
				await itemRepository.save(
					lines.map((line) => itemRepository.create(line)),
				);
			}

			existingTokens.add(token);

			inserted++;
		}

		return {
			entity: 'cart',
			alreadyPresent: alreadyPresent,
			inserted: inserted,
			target: TARGET_CARTS,
			tableTotal: await repository.count(),
		};
	},
};

if (isDirectRun(import.meta.url)) {
	await runSeedFile(cartSeed);
}
