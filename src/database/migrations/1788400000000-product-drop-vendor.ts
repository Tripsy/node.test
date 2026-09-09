import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops `product.vendor_id`.
 *
 * Which vendor supplies a product is a fact about a purchase, not about the catalog entry: the
 * same item can arrive from several suppliers over its life, and `grn` already records that per
 * receipt through its own `vendor_id`. The single column on `product` could only ever name one
 * of them, and nothing read it apart from the dashboard field that set it.
 *
 * **`down()` cannot restore the values.** It rebuilds the column, its index and the foreign key,
 * so the schema round-trips, but every product comes back with a null vendor - the assignments
 * live only in whatever backup predates this migration.
 */
export class ProductDropVendor1788400000000 implements MigrationInterface {
	name = 'ProductDropVendor1788400000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// The foreign key first: Postgres refuses to drop a column another constraint depends on.
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "FK_0539bfedcb00e1f04dd6d3df10a"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_vendor_id"`);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "vendor_id"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product" ADD "vendor_id" integer`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_vendor_id" ON "product" ("vendor_id")`,
		);
		// `SET NULL` as before: an absent vendor was always a legitimate state for a product.
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "FK_0539bfedcb00e1f04dd6d3df10a" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}
}
