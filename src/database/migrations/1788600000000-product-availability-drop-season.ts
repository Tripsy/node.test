import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops `product_availability.valid_from` / `valid_until`, and the check constraint that ordered
 * the pair.
 *
 * The two columns bounded the *recurrence* rather than the product: a window that repeats daily
 * but only between May and September. That is a season, and a season is the product's own life in
 * the catalog — which `product.available_from` / `available_until` already describe, and which
 * `sale_status` is derived from. Keeping a second, weaker pair one level down meant two places to
 * express "not this month" with only one of them affecting whether the product is listed.
 *
 * A window is now purely a weekday and a span of clock times, which is also what makes it a
 * natural key: `syncWindows` matches on the row's content, and dropping two nullable columns from
 * that key leaves it shorter without making it ambiguous.
 *
 * **`down()` cannot restore the values.** It rebuilds both columns and the constraint, so the
 * schema round-trips, but every window comes back unbounded — the dates live only in whatever
 * backup predates this migration.
 */
export class ProductAvailabilityDropSeason1788600000000
	implements MigrationInterface
{
	name = 'ProductAvailabilityDropSeason1788600000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// The constraint first: Postgres refuses to drop a column a check depends on.
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP CONSTRAINT "CHK_3f0e5cd351402002527fc2ef76"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP COLUMN "valid_from"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP COLUMN "valid_until"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD COLUMN "valid_from" date`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD COLUMN "valid_until" date`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."valid_from" IS 'First date this window applies; NULL means no lower bound'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."valid_until" IS 'Last date this window applies; NULL means no upper bound'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD CONSTRAINT "CHK_3f0e5cd351402002527fc2ef76" CHECK ((valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from))`,
		);
	}
}
