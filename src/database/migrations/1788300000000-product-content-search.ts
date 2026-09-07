import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The GIN index backing `ProductQuery.filterByTerm`.
 *
 * Hand-written for the reason `1786415990000-search-indexes.ts` gives: TypeORM's `@Index`
 * decorator only describes column lists, and a full-text index has to be built over an
 * expression. It must therefore not be added to the entity, or every future generated migration
 * would try to drop it.
 *
 * The expression is duplicated from the repository on purpose — Postgres only uses an expression
 * index when the query repeats it verbatim, down to the `COALESCE` and the `'simple'`
 * configuration. Change one side and the catalog search silently reverts to a sequential scan.
 *
 * The code half of that filter is a prefix match over `product_variant.sku` rather than part of
 * this expression: a code is one token with punctuation in it, which the `simple` configuration
 * would split apart. Its own index is created by `1788500000000-product-drop-sku.ts`.
 */
export class ProductContentSearch1788300000000 implements MigrationInterface {
	name = 'ProductContentSearch1788300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_product_content_search" ON "product_content" USING GIN (to_tsvector('simple', COALESCE("label", '') || ' ' || COALESCE("description", '')))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_search"`,
		);
	}
}
