import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops `IDX_product_type` and `IDX_product_composition`, for the reason
 * `1789100000000-product-drop-sale-status-index.ts` dropped `IDX_product_sale_status`.
 *
 * Both back an optional facet on the dashboard listing and nothing else: `type` is three values
 * skewing to `physical`, `composition` two skewing to `simple`. Admin traffic, always paginated,
 * and at that cardinality Postgres seq-scans for the common value regardless — so neither index
 * is picked for the query it exists for, while both are maintained on every product write.
 *
 * `IDX_product_workflow` stays, and the difference is worth stating because the rule above looks
 * like it should reach that one too. It does not: `draft`, `pending_review` and
 * `revision_required` are each a small minority of the catalog, and the review queue seeks them
 * by name. An index over a skewed enum earns its keep when the query asks for a rare value, which
 * is true there and of nothing here.
 */
export class ProductDropEnumFacetIndexes1789800000000
	implements MigrationInterface
{
	name = 'ProductDropEnumFacetIndexes1789800000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_product_type"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_composition"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_product_composition" ON "product" ("composition")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_type" ON "product" ("type")`,
		);
	}
}
