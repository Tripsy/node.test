import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops every `IDX_<table>_deleted_at`, the partial index `@SoftDeleteIndex` put on all 47
 * soft-deletable tables.
 *
 * The shape was `(deleted_at) WHERE deleted_at IS NULL`: one key value repeated once per live row.
 * A soft delete here is a person removing a record, so live rows are all but a rounding error of
 * the table, and an index that keeps every one of them tells the planner nothing it can narrow
 * with. Measured at 500k rows with 2% deleted, it was chosen by none of the four shapes the code
 * actually issues — a selective equality plus `deleted_at IS NULL`, a skewed enum plus the same, a
 * paginated `ORDER BY id DESC LIMIT`, and the `COUNT(*)` behind pagination — each of which
 * applies `deleted_at` as a filter over a plan chosen for the other predicate. What it did cost
 * was one extra buffer touch per row inserted, on every one of those tables.
 *
 * It looks used on a small database, and that is worth knowing before reinstating it: under a few
 * hundred rows the planner will `BitmapAnd` it against the selective index, because at that size
 * every estimate is a rounding error and the extra scan is free. Those `idx_scan` counters are an
 * artifact of the row count, not evidence the index earns its place.
 *
 * **When it would earn its place:** once soft-deleted rows come to dominate a table, the predicate
 * turns selective and the same index becomes the right plan — at 81% deleted it was chosen
 * outright. No table here is near that, and the way to keep it that way is to purge tombstones
 * rather than to index around them. Reinstate it per table, on measurement, never as a default.
 *
 * `IF EXISTS`, and a guard on the way back, because `cli/feature.ts` installs and removes
 * features: which of these tables a given deployment holds is not fixed.
 */
export class DropSoftDeleteIndexes1789900000000 implements MigrationInterface {
	name = 'DropSoftDeleteIndexes1789900000000';

	private static readonly TARGETS = `
		SELECT *
		FROM (
			VALUES
				('public', 'address'),
				('public', 'article'),
				('public', 'article_category'),
				('public', 'article_tag'),
				('public', 'article_visibility_rule'),
				('public', 'brand'),
				('public', 'carrier'),
				('public', 'cash_flow'),
				('public', 'category'),
				('public', 'client'),
				('public', 'complaint'),
				('public', 'discount'),
				('public', 'discount_target'),
				('public', 'grn'),
				('public', 'grn_item'),
				('public', 'invoice'),
				('public', 'operational_record'),
				('public', 'order'),
				('public', 'order_product'),
				('public', 'order_shipping'),
				('public', 'order_shipping_product'),
				('public', 'place'),
				('public', 'product'),
				('public', 'product_attribute'),
				('public', 'product_availability'),
				('public', 'product_bundle_group'),
				('public', 'product_bundle_item'),
				('public', 'product_bundle_item_price'),
				('public', 'product_category'),
				('public', 'product_category_attribute'),
				('public', 'product_category_attribute_option'),
				('public', 'product_option'),
				('public', 'product_option_group'),
				('public', 'product_option_price'),
				('public', 'product_price'),
				('public', 'product_tag'),
				('public', 'product_variant'),
				('public', 'product_variant_attribute'),
				('public', 'review'),
				('public', 'subscription'),
				('public', 'term'),
				('public', 'user'),
				('public', 'user_permission'),
				('public', 'vendor'),
				('public', 'warehouse'),
				('system', 'permission'),
				('system', 'template')
		) AS t(schema_name, table_name)
	`;

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DO $$
			DECLARE
				target record;
			BEGIN
				FOR target IN ${DropSoftDeleteIndexes1789900000000.TARGETS}
				LOOP
					EXECUTE format(
						'DROP INDEX IF EXISTS %I.%I',
						target.schema_name,
						'IDX_' || target.table_name || '_deleted_at'
					);
				END LOOP;
			END
			$$;
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DO $$
			DECLARE
				target record;
			BEGIN
				FOR target IN ${DropSoftDeleteIndexes1789900000000.TARGETS}
				LOOP
					IF to_regclass(format('%I.%I', target.schema_name, target.table_name)) IS NOT NULL THEN
						EXECUTE format(
							'CREATE INDEX IF NOT EXISTS %I ON %I.%I (deleted_at) WHERE deleted_at IS NULL',
							'IDX_' || target.table_name || '_deleted_at',
							target.schema_name,
							target.table_name
						);
					END IF;
				END LOOP;
			END
			$$;
		`);
	}
}
