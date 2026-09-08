import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reshapes the availability indexes to lead on the timestamp the recompute cron actually seeks.
 *
 * `IDX_product_sale_status_available_from` / `..._available_until` led on `sale_status`, and
 * `recompute-product-sale-status.cron.ts` never constrains it — its candidate set is an `OR` of
 * three timestamp comparisons and nothing else. A btree can only apply a condition on its leading
 * column, so with that column unbounded the index was reachable by a full scan alone and the
 * planner took the heap instead. Leading on the timestamp makes each branch a range seek, which
 * is what `BitmapOr` needs to combine them.
 *
 * `discontinued_at` gains one for the first time. It was left out on the grounds that nothing
 * scans for it — true of the write paths, which move `sale_status` in the same statement, but not
 * of the cron, whose third `OR` branch is exactly that scan.
 *
 * The predicates stay partial on `IS NOT NULL`: a catalog's dated rows are a small slice of it,
 * and every branch of the cron's `OR` tests the column for null first.
 *
 * **This only helps the seek, not the selectivity.** `available_from <= now()` matches every row
 * that has ever opened, so on a mature catalog the bitmap covers most of the table and the
 * `sale_status <> CASE ...` clause — the one that makes the set drain — is not indexable at all.
 * If `product` grows past the point where these earn their write cost, dropping all three and
 * letting the three-hourly pass scan is the better trade.
 */
export class ProductSaleStatusCronIndexes1789700000000
	implements MigrationInterface
{
	name = 'ProductSaleStatusCronIndexes1789700000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status_available_from"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status_available_until"`,
		);

		await queryRunner.query(
			`CREATE INDEX "IDX_product_available_from" ON "product" ("available_from") WHERE available_from IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_available_until" ON "product" ("available_until") WHERE available_until IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_discontinued_at" ON "product" ("discontinued_at") WHERE discontinued_at IS NOT NULL AND deleted_at IS NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_discontinued_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_available_until"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_available_from"`,
		);

		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status_available_from" ON "product" ("sale_status", "available_from") WHERE available_from IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status_available_until" ON "product" ("sale_status", "available_until") WHERE available_until IS NOT NULL AND deleted_at IS NULL`,
		);
	}
}
