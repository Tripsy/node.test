import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Makes `product_availability.starts_at` / `ends_at` nullable, so a whole-day window can be
 * stated as a weekday with no hours - "available on Sundays" rather than "available on Sundays
 * from 00:00 to 23:59", which is the same rule spelled as a workaround.
 *
 * **Both or neither.** A row with one time set has no reading anything could agree on: is
 * `starts_at = 18:00, ends_at = NULL` open until midnight, until close, or malformed? The old
 * `ends_at > starts_at` check is therefore replaced by two - one pairing the columns, one keeping
 * the ordering when they are present - rather than merely relaxed to tolerate nulls.
 *
 * Note that a whole-day window on **every** day (`day_of_week` null too) restricts nothing, which
 * is what an empty set already means. Nothing rejects it: the row is redundant rather than wrong,
 * and a rule against it would have to be mirrored in two validators to catch a case that costs
 * one harmless row.
 *
 * `down()` is safe for the schema but not for the data: it restores `NOT NULL`, so any whole-day
 * window has to be given hours first. It fills them with `00:00`–`23:59:59`, which is the closest
 * the old shape came to expressing the same thing.
 */
export class ProductAvailabilityAllDay1788700000000
	implements MigrationInterface
{
	name = 'ProductAvailabilityAllDay1788700000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// The old ordering check first: it cannot survive a null on either side.
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP CONSTRAINT "CHK_49589a4cb61d4b05607ab4a349"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ALTER COLUMN "starts_at" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ALTER COLUMN "ends_at" DROP NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."starts_at" IS 'Window opens, venue local time; NULL together with ends_at means all day'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."ends_at" IS 'Window closes, venue local time; NULL together with starts_at means all day'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD CONSTRAINT "CHK_product_availability_hours_paired" CHECK (("starts_at" IS NULL) = ("ends_at" IS NULL))`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD CONSTRAINT "CHK_product_availability_hours_order" CHECK ("starts_at" IS NULL OR "ends_at" > "starts_at")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP CONSTRAINT "CHK_product_availability_hours_order"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" DROP CONSTRAINT "CHK_product_availability_hours_paired"`,
		);
		// `NOT NULL` cannot be restored over a whole-day window, so it is given the widest span
		// the old shape could express.
		await queryRunner.query(
			`UPDATE "product_availability" SET "starts_at" = '00:00:00', "ends_at" = '23:59:59' WHERE "starts_at" IS NULL OR "ends_at" IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ALTER COLUMN "starts_at" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ALTER COLUMN "ends_at" SET NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."starts_at" IS 'Window opens, venue local time'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_availability"."ends_at" IS 'Window closes, venue local time'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_availability" ADD CONSTRAINT "CHK_49589a4cb61d4b05607ab4a349" CHECK ((ends_at > starts_at))`,
		);
	}
}
