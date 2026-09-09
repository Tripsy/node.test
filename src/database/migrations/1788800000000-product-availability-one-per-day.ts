import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One ordering interval per day, per product.
 *
 * `NULLS NOT DISTINCT` is the point of the index: Postgres treats nulls as distinct in a unique
 * index by default, so without it a product could carry two every-day intervals - the exact case
 * the rule is meant to stop. Partial on `deleted_at IS NULL` so a withdrawn interval does not
 * block re-stating the same day later.
 *
 * **It cannot express the whole rule.** An every-day interval (`day_of_week` null) also conflicts
 * with an interval on a *specific* day, and that is a comparison between rows holding different
 * values - no unique index reaches it. `ProductValidator` carries that half, and both halves are
 * stated in `.claude/rules/product.md` §9. The index is the backstop for the part it can hold:
 * a payload is validated, but a concurrent write is not.
 *
 * Hand-written for the reason `1788300000000-product-content-search.ts` gives - `@Index` cannot
 * express `NULLS NOT DISTINCT`, so this must not be added to the entity or every generated
 * migration would try to drop it.
 *
 * `IDX_product_availability_product_id` stays: it is not partial, so it is still the index a read
 * that includes withdrawn intervals uses.
 */
export class ProductAvailabilityOnePerDay1788800000000
	implements MigrationInterface
{
	name = 'ProductAvailabilityOnePerDay1788800000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_availability_day_unique" ON "product_availability" ("product_id", "day_of_week") NULLS NOT DISTINCT WHERE deleted_at IS NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_availability_day_unique"`,
		);
	}
}
