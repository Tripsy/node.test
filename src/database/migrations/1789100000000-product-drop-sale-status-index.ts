import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops `IDX_product_sale_status`.
 *
 * The index existed for the sellable filter, which named `sale_status` alongside the availability
 * timestamps. That clause is gone: the column is caught up by a cron and so trails the deadlines
 * it describes between passes, and the filter now compares all three timestamps directly -
 * `discontinued_at` included, which is what a scheduled withdrawal turns on.
 *
 * What is left reading the column is the dashboard's status facet: admin traffic, paginated, over
 * four values that skew heavily to `available`. Postgres would seq-scan for the common one
 * regardless, so the index earns nothing and still has to be maintained on every write.
 *
 * `IDX_product_sale_status_available_from` / `..._available_until` are untouched. They lead on
 * `sale_status` but exist for the recompute cron, which seeks on the timestamp beside it.
 */
export class ProductDropSaleStatusIndex1789100000000
	implements MigrationInterface
{
	name = 'ProductDropSaleStatusIndex1789100000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status" ON "product" ("sale_status")`,
		);
	}
}
