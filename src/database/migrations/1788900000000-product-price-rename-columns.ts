import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames `product_price.price` → `sale_price` and `rrp` → `reference_price`.
 *
 * Both old names read as more than they are. `price` sat beside `cost_price` and `min_price` in
 * the same payload, where the bare word says nothing about which of the three a reader is looking
 * at; `rrp` is an abbreviation whose expansion ("recommended retail price") still does not say
 * that the column is never charged. `sale_price` and `reference_price` name what each figure is
 * for, which is what the dashboard labels now say too.
 *
 * `RENAME COLUMN` preserves the data and Postgres rewrites the check expressions to follow the
 * new names — but the constraints keep their old hashed names, which TypeORM derives from the
 * expression. Left alone, every later `migration:generate` would try to drop and re-add them, so
 * the three are dropped and recreated here under the names the renamed expressions hash to.
 */
export class ProductPriceRenameColumns1788900000000
	implements MigrationInterface
{
	name = 'ProductPriceRenameColumns1788900000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_price" RENAME COLUMN "price" TO "sale_price"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" RENAME COLUMN "rrp" TO "reference_price"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_price"."sale_price" IS 'What the customer is charged, per \`product.unit\`'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_price"."reference_price" IS 'The usual price this sale is measured against (a manufacturer''s RRP, a list price); display only, never charged'`,
		);

		// The three checks, restated under the names their renamed expressions hash to.
		await queryRunner.query(
			`ALTER TABLE "product_price" DROP CONSTRAINT "CHK_1c5bad62a27cdf9b84df52383b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" DROP CONSTRAINT "CHK_b333e86b299c9a4bfaad60366c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" DROP CONSTRAINT "CHK_ad11e792129c9db8f6e1db43fd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" ADD CONSTRAINT "CHK_586ebf7f8d2a8512644b30951e" CHECK ((sale_price > 0))`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" ADD CONSTRAINT "CHK_106bdefdc8d75378ca855d0911" CHECK ((reference_price IS NULL OR reference_price > 0))`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" ADD CONSTRAINT "CHK_fdb767537306f80593e4e9cbe4" CHECK ((min_price IS NULL OR min_price <= sale_price))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_price" DROP CONSTRAINT "CHK_fdb767537306f80593e4e9cbe4"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" DROP CONSTRAINT "CHK_106bdefdc8d75378ca855d0911"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" DROP CONSTRAINT "CHK_586ebf7f8d2a8512644b30951e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" ADD CONSTRAINT "CHK_1c5bad62a27cdf9b84df52383b" CHECK ((sale_price > 0))`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" ADD CONSTRAINT "CHK_b333e86b299c9a4bfaad60366c" CHECK ((reference_price IS NULL OR reference_price > 0))`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" ADD CONSTRAINT "CHK_ad11e792129c9db8f6e1db43fd" CHECK ((min_price IS NULL OR min_price <= sale_price))`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_price"."reference_price" IS 'Manufacturer''s recommended retail price; display reference only, never charged'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_price"."sale_price" IS 'The selling price, per \`product.unit\`'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" RENAME COLUMN "reference_price" TO "rrp"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_price" RENAME COLUMN "sale_price" TO "price"`,
		);
	}
}
