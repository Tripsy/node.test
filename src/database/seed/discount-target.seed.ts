import type { EntityManager } from 'typeorm';
import {
	loadIds,
	type SeedDefinition,
	type SeedSummary,
} from '@/database/seed/seed.helper';
import BrandEntity from '@/features/brand/brand.entity';
import CategoryEntity from '@/features/category/category.entity';
import ClientEntity from '@/features/client/client.entity';
import DiscountEntity, {
	type DiscountScope,
	DiscountScopeEnum,
} from '@/features/discount/discount.entity';
import DiscountTargetEntity, {
	type DiscountTargetType,
	DiscountTargetTypeEnum,
} from '@/features/discount/discount-target.entity';
import ProductEntity from '@/features/product/product.entity';
import ProductVariantEntity from '@/features/product/product-variant.entity';

/**
 * Links the seeded discounts to the entities they apply to.
 *
 * Lives in the seed orchestrator rather than in `discount`, so that owning the demo wiring does
 * not hand `discount` a dependency on every catalog feature it points at. The target table
 * itself is polymorphic and carries no foreign key, so nothing here needs the owning entities
 * except to read real ids.
 *
 * Every scope but `order` is covered — that one applies to the basket as a whole and points at
 * nothing. A plan whose owners are absent (a feature removed, or its seed not yet run) simply
 * links nothing rather than failing.
 */

type LinkPlan = {
	scope: DiscountScope;
	targetType: DiscountTargetType;
	// biome-ignore lint/suspicious/noExplicitAny: five unrelated owner entities
	ownerEntity: new () => any;
	/** Narrows which owners are eligible; categories are a mixed tree of two types. */
	ownerWhere?: Record<string, unknown>;
};

const PLANS: readonly LinkPlan[] = [
	{
		scope: DiscountScopeEnum.CLIENT,
		targetType: DiscountTargetTypeEnum.CLIENT,
		ownerEntity: ClientEntity,
	},
	{
		scope: DiscountScopeEnum.CATEGORY,
		targetType: DiscountTargetTypeEnum.CATEGORY,
		ownerEntity: CategoryEntity,
		// Product categories only — a discount on a blog category would never resolve.
		ownerWhere: { type: 'product' },
	},
	{
		scope: DiscountScopeEnum.BRAND,
		targetType: DiscountTargetTypeEnum.BRAND,
		ownerEntity: BrandEntity,
	},
	/*
	 * Unfiltered on purpose: a launch offer is written before the product it announces is
	 * sellable, so narrowing to the live catalog would leave the scheduled campaigns pointing
	 * at nothing.
	 */
	{
		scope: DiscountScopeEnum.PRODUCT,
		targetType: DiscountTargetTypeEnum.PRODUCT,
		ownerEntity: ProductEntity,
	},
	{
		scope: DiscountScopeEnum.VARIANT,
		targetType: DiscountTargetTypeEnum.VARIANT,
		ownerEntity: ProductVariantEntity,
	},
];

/** Pairs already linked, so a re-run adds nothing twice. */
async function existingPairs(
	manager: EntityManager,
	targetType: DiscountTargetType,
): Promise<Set<string>> {
	const rows = await manager.getRepository(DiscountTargetEntity).find({
		where: { target_type: targetType },
		select: { discount_id: true, entity_id: true },
		withDeleted: true,
	});

	return new Set(rows.map((row) => `${row.discount_id}:${row.entity_id}`));
}

export const discountTargetSeed: SeedDefinition = {
	name: 'discount-target',
	run: async ({ manager }): Promise<SeedSummary> => {
		let inserted = 0;
		let alreadyPresent = 0;
		let target = 0;

		for (const plan of PLANS) {
			const discountIds = await loadIds(manager, DiscountEntity, {
				scope: plan.scope,
			});

			const ownerIds = await loadIds(
				manager,
				plan.ownerEntity,
				plan.ownerWhere ?? {},
			);

			if (discountIds.length === 0 || ownerIds.length === 0) {
				continue;
			}

			const seen = await existingPairs(manager, plan.targetType);

			const rows: Record<string, unknown>[] = [];

			discountIds.forEach((discountId, index) => {
				/*
				 * Two owners per discount, walked round-robin. Enough for the resolver's
				 * "largest wins" path to have something to choose between without pinning the
				 * seed to any particular row.
				 */
				for (let offset = 0; offset < 2; offset++) {
					const ownerId =
						ownerIds[(index * 2 + offset) % ownerIds.length];

					const key = `${discountId}:${ownerId}`;

					target++;

					if (seen.has(key)) {
						alreadyPresent++;
						continue;
					}

					seen.add(key);
					rows.push({
						discount_id: discountId,
						target_type: plan.targetType,
						entity_id: ownerId,
					});
				}
			});

			if (rows.length > 0) {
				await manager
					.getRepository(DiscountTargetEntity)
					.save(rows, { chunk: 50 });

				inserted += rows.length;
			}
		}

		return {
			entity: 'discount-target',
			alreadyPresent,
			inserted,
			target,
			tableTotal: alreadyPresent + inserted,
		};
	},
};
