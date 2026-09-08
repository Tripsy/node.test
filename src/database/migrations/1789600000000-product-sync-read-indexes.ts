import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gives every child table of a product an index its `sync*` read can actually use.
 *
 * Each of those reads asks for one parent's rows **including the soft-deleted ones**, so it can
 * revive a row rather than insert a second one that collides with a partial unique index:
 *
 * ```ts
 * const existing = await repository.find({ where: { variant_id }, withDeleted: true });
 * ```
 *
 * A partial index `WHERE deleted_at IS NULL` cannot answer a query that carries no such
 * predicate, and on these eight tables the parent key appeared in nothing else — so every save of
 * a product sequentially scanned each of them. The same index is what the foreign key needs when
 * a hard delete cascades, which looks the children up by that key with no regard for
 * `deleted_at` either.
 *
 * `IDX_product_availability_product_id` is the shape being copied: `1788800000000` kept it
 * non-partial alongside its partial unique for exactly this reason.
 *
 * Two of the eight are handled without a new index. `product_category_attribute_option` already
 * had a plain index leading on `attribute_id` that was partial for no reason the reads require,
 * so the predicate is dropped instead. `product_category` and `product_tag` each get their new
 * parent-side index *and* a widened filter-side one: the catalog listings seek those by
 * `category_id` / `tag_id` and need `product_id` back, which the single-column shape could only
 * supply from the heap.
 */
export class ProductSyncReadIndexes1789600000000 implements MigrationInterface {
	name = 'ProductSyncReadIndexes1789600000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_product_price_variant_id" ON "product_price" ("variant_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_attribute_variant_id" ON "product_variant_attribute" ("variant_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_product_id" ON "product_attribute" ("product_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_option_price_option_id" ON "product_option_price" ("option_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_price_item_id" ON "product_bundle_item_price" ("item_id")`,
		);

		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_product_id" ON "product_category" ("product_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_product_id" ON "product_tag" ("product_id")`,
		);

		// Widened to carry the product back, so the listing's category and tag filters resolve
		// from the index instead of visiting the heap for every matched link
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_category_id"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_category_id" ON "product_category" ("category_id", "product_id")`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_tag_id"`);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_tag_id" ON "product_tag" ("tag_id", "product_id")`,
		);

		// The ordered read of a definition's options does not need the predicate, and without it
		// the same index also answers the sync read
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_attribute_option_attribute_id"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_option_attribute_id" ON "product_category_attribute_option" ("attribute_id", "sort_order")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_attribute_option_attribute_id"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_attribute_option_attribute_id" ON "product_category_attribute_option" ("attribute_id", "sort_order") WHERE deleted_at IS NULL`,
		);

		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_tag_id"`);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_tag_id" ON "product_tag" ("tag_id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_category_id"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_category_id" ON "product_category" ("category_id")`,
		);

		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_tag_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_price_item_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_option_price_option_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_attribute_variant_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_price_variant_id"`,
		);
	}
}
