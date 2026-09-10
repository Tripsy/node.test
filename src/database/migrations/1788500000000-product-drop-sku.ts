import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops `product.sku` and gives the catalog search the index it always claimed to have.
 *
 * The product carried a "style code" one level above `product_variant.sku`, the code that is
 * actually sold. For a single-variant product - the normal case - the two said the same thing
 * twice, and nothing downstream read the product-level one: no order line, goods receipt, invoice
 * or report ever referenced it. What replaces it as a human handle is the translation's `label`,
 * and as a searchable code, the variant's own SKU.
 *
 * `IDX_product_variant_sku_prefix` is what makes that search affordable. It is hand-written for the
 * reason `1788300000000-product-content-search.ts` gives - an expression index cannot come from a
 * decorator, so it must not be added to the entity or every generated migration would try to drop
 * it. `lower(sku)` with `text_pattern_ops` is the pairing a prefix `LIKE` can seek on;
 * `ProductQuery.filterByTerm` must keep spelling the predicate as `lower(sku) LIKE lower(:term)`,
 * because an `ILIKE` cannot use it and silently reverts to a sequential scan.
 */
export class ProductDropSku1788500000000 implements MigrationInterface {
	name = 'ProductDropSku1788500000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_product_sku"`);
		await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "sku"`);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_variant_sku_prefix" ON "product_variant" (lower("sku") text_pattern_ops) WHERE deleted_at IS NULL`,
		);
	}

	/**
	 * The column comes back `NOT NULL` under a unique index, so it cannot simply be re-added: it is
	 * backfilled first, from the product's default variant - the code that was closest to being the
	 * style code anyway - and from the id where a product has no live variant to borrow from.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_variant_sku_prefix"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD COLUMN "sku" character varying`,
		);
		await queryRunner.query(`
			UPDATE "product" p
			SET "sku" = COALESCE(
				(
					SELECT v."sku"
					FROM "product_variant" v
					WHERE v."product_id" = p."id" AND v."deleted_at" IS NULL
					ORDER BY v."is_default" DESC, v."id" ASC
					LIMIT 1
				),
				'PRODUCT-' || p."id"
			)
		`);
		await queryRunner.query(
			`ALTER TABLE "product" ALTER COLUMN "sku" SET NOT NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_sku" ON "product" ("sku") WHERE deleted_at IS NULL`,
		);
	}
}
