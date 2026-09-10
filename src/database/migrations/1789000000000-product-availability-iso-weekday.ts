import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Moves `product_availability.day_of_week` onto ISO 8601 weekdays - 1 = Monday through
 * 7 = Sunday - where `discount.conditions.day_range` already was.
 *
 * Two numberings for one concept is a bug waiting for its first reader: nothing yet evaluates an
 * availability window, but the moment something does it will sit beside the discount resolver,
 * and a day that reads as Sunday on one side and Monday on the other is invisible to both types
 * and tests. ISO wins because it is what the only working evaluator speaks, and because it is the
 * numbering an API contract should expose.
 *
 * **The order in `up()` is load-bearing.** Remapping 0 to 7 violates the old 0–6 check, so that
 * constraint has to go first and the new one can only be added once no row is out of range.
 *
 * The remap cannot collide with `IDX_product_availability_day_unique`: 7 was unreachable under the
 * old bound, so no product can already hold both a 0 and a 7 for the unique index to catch.
 *
 * The old constraint carried a generated name, which is why it is spelled out here and restored
 * verbatim in `down()` - the entity now names its replacement, matching its two siblings.
 */
export class ProductAvailabilityIsoWeekday1789000000000
	implements MigrationInterface
{
	name = 'ProductAvailabilityIsoWeekday1789000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP CONSTRAINT "CHK_0739a0d7c3f0eaeec9bb58e457"`,
		);

		// Sunday is the only day whose number moves; 1–6 mean the same in both numberings
		await queryRunner.query(
			`UPDATE "product_availability" SET "day_of_week" = 7 WHERE "day_of_week" = 0`,
		);

		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD CONSTRAINT "CHK_product_availability_day_of_week" CHECK ((day_of_week IS NULL OR (day_of_week >= 1 AND day_of_week <= 7)))`,
		);

		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."day_of_week" IS 'Day this window applies to, ISO 8601 weekday, 1 = Monday; NULL means every day'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP CONSTRAINT "CHK_product_availability_day_of_week"`,
		);

		await queryRunner.query(
			`UPDATE "product_availability" SET "day_of_week" = 0 WHERE "day_of_week" = 7`,
		);

		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD CONSTRAINT "CHK_0739a0d7c3f0eaeec9bb58e457" CHECK ((day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)))`,
		);

		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."day_of_week" IS 'Day this window applies to, 0 = Sunday; NULL means every day'`,
		);
	}
}
