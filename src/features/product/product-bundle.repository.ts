import type { EntityManager, Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import type { ProductBundleItemType } from '@/features/product/product.validator';
import ProductBundleItemEntity from '@/features/product/product-bundle-item.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ProductBundleItemQuery extends RepositoryAbstract<ProductBundleItemEntity> {
	constructor(repository: Repository<ProductBundleItemEntity>) {
		super(repository, ProductBundleItemEntity.NAME);
	}
}

/**
 * The composition side. Unlike `product-option.repository.ts` there are no groups here: a bundle
 * is a flat list of components, every one of them always included. What an item names is a
 * `product_variant` — a real sellable thing that consumes stock and carries its own VAT class —
 * where an option names a term.
 *
 * The variant is therefore the natural key of an item, as the label term is of an option.
 */
export const ProductBundleRepository = dataSource
	.getRepository(ProductBundleItemEntity)
	.extend({
		createQuery() {
			return new ProductBundleItemQuery(this);
		},

		/**
		 * The components of one bundle. Rows are matched by variant, so a component whose
		 * quantity or position changed is updated rather than replaced — which keeps the id an
		 * order line may already reference.
		 */
		async syncItems(
			manager: EntityManager,
			product_id: number,
			items: ProductBundleItemType[],
		): Promise<void> {
			const repository = manager.getRepository(ProductBundleItemEntity);

			const existing = await repository.find({
				where: { product_id },
				withDeleted: true,
			});

			const wanted = new Map(
				items.map((item) => [item.variant_id, item]),
			);
			const known = new Map(existing.map((row) => [row.variant_id, row]));

			const toRemove = existing.filter(
				(row) => row.deleted_at === null && !wanted.has(row.variant_id),
			);

			if (toRemove.length > 0) {
				await repository.softRemove(toRemove);
			}

			const toSave: ProductBundleItemEntity[] = [];

			for (const [variant_id, item] of wanted) {
				const row =
					known.get(variant_id) ??
					repository.create({ product_id, variant_id });

				row.deleted_at = null;
				row.quantity = item.quantity ?? 1;
				row.position = item.position ?? 0;

				toSave.push(row);
			}

			if (toSave.length > 0) {
				await repository.save(toSave);
			}
		},
	});

export default ProductBundleRepository;
