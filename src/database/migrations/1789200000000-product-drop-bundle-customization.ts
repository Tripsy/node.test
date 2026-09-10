import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the customizable half of a bundle: choice groups, the per-candidate price delta, and the
 * two columns on `product_bundle_item` that only meant anything inside a group.
 *
 * A bundle is now a flat list of components, all of them always included. What went away is the
 * "choose a drink, +6.00" shape - a question asked at order time whose answer is another product.
 * Nothing consumed it: no order, invoice or report read `product_bundle_item_price`, and the
 * dashboard could never create a group, so every row in the wild came from the seed.
 *
 * `product_option_group` / `product_option` / `product_option_price` are untouched. They mirror
 * these tables in shape but answer a different question - an option's answer is a label with a
 * delta and nothing behind it, so asking the customer something and adjusting the price is still
 * expressible; only "the answer is another product" is gone.
 *
 * `is_default` goes with the groups. It meant "preselected within its group", which its own column
 * comment said was meaningless without one, and its unique index was scoped to `group_id`.
 */
export class ProductDropBundleCustomization1789200000000
	implements MigrationInterface
{
	name = 'ProductDropBundleCustomization1789200000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// The delta table first: it references `product_bundle_item`.
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item_price" DROP CONSTRAINT "FK_acfab32b10d24fe85d0b91b996c"`,
		);
		await queryRunner.query(`DROP TABLE "product_bundle_item_price"`);

		// Then the item's own group ties, before the table they point at.
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP CONSTRAINT "FK_702709f0297263e9fc92c7c1dc2"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_default"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_bundle_item_group_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP COLUMN "group_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP COLUMN "is_default"`,
		);

		// Both comments named the group, so they drift from the entity if left behind
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS 'A component always included in a bundle'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."position" IS 'Display order within the bundle'`,
		);

		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" DROP CONSTRAINT "FK_b27dcfe0bbadcba2a4c9dd236de"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" DROP CONSTRAINT "FK_263ebca8a1a834f257faee33318"`,
		);
		await queryRunner.query(`DROP TABLE "product_bundle_group"`);
	}

	/**
	 * Rebuilds the schema, not the data. Every group, every candidate's `group_id` and every delta
	 * is gone once `up` has run - a bundle that offered a choice comes back as the flat list of
	 * whatever components survived, with the candidates now always included.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "product_bundle_group" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "label_id" integer NOT NULL, "min_select" integer NOT NULL DEFAULT '0', "max_select" integer, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_db5a6646886c80ea72ff7952d3" CHECK ((max_select IS NULL OR max_select >= min_select)), CONSTRAINT "CHK_822a5a74fc80e1915026de1c0c" CHECK ((min_select >= 0)), CONSTRAINT "PK_08f1302234d4b46d3560277d829" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_bundle_group"."label_id" IS 'Term holding the multilingual prompt, e.g. "Choose a drink"'; COMMENT ON COLUMN "product_bundle_group"."min_select" IS 'Candidates that must be chosen; 0 makes the group optional'; COMMENT ON COLUMN "product_bundle_group"."max_select" IS 'Candidates that may be chosen; NULL means no upper bound'; COMMENT ON COLUMN "product_bundle_group"."position" IS 'Display order within the bundle'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_label_id" ON "product_bundle_group" ("label_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_product_id" ON "product_bundle_group" ("product_id", "position")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_deleted_at" ON "product_bundle_group" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" ADD CONSTRAINT "FK_b27dcfe0bbadcba2a4c9dd236de" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" ADD CONSTRAINT "FK_263ebca8a1a834f257faee33318" FOREIGN KEY ("label_id") REFERENCES "term"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS 'A component of a bundle; NULL group_id means always included, otherwise a candidate within that group'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."position" IS 'Display order within the group, or within the bundle'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD COLUMN "is_default" boolean NOT NULL DEFAULT false`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."is_default" IS 'Preselected within its group; meaningless without one'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD COLUMN "group_id" integer`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."group_id" IS 'NULL means the component is always included, not a choice'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_group_id" ON "product_bundle_item" ("group_id", "position")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_bundle_item_default" ON "product_bundle_item" ("group_id") WHERE is_default = true AND group_id IS NOT NULL AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD CONSTRAINT "FK_702709f0297263e9fc92c7c1dc2" FOREIGN KEY ("group_id") REFERENCES "product_bundle_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);

		await queryRunner.query(
			`CREATE TABLE "product_bundle_item_price" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "item_id" integer NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "price_delta" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_7a3e4166f3ca6678a53698aa79e" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_bundle_item_price"."price_delta" IS 'Added to the bundle price; negative subtracts'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_bundle_item_price_unique" ON "product_bundle_item_price" ("item_id", "currency") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_item_price_deleted_at" ON "product_bundle_item_price" ("deleted_at") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item_price" ADD CONSTRAINT "FK_acfab32b10d24fe85d0b91b996c" FOREIGN KEY ("item_id") REFERENCES "product_bundle_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}
}
