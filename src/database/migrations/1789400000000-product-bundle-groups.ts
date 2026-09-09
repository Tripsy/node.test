import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gives a bundle the one thing `is_optional` cannot express: **exactly one of these**.
 *
 * `product_bundle_group` is a question asked inside a bundle - "choose your fries" - and
 * `product_bundle_item.group_id` makes a component a candidate for it. Two independent tick boxes
 * can both be taken or both left; a group takes exactly one of its candidates.
 *
 * It carries no `min_select` / `max_select`, unlike `product_option_group`. A bound counting
 * candidate rows cannot state the one case that would need it - a mixed pack is a number of
 * *units*, and each row carries its own `quantity` - so the pair would have been two
 * columns nothing could read correctly. Exactly one is the whole of what a bundle choice means.
 *
 * `is_optional` keeps its meaning outside a group and is refused inside one, where the group
 * decides. `product_bundle_item_price` is untouched and keeps the single meaning it was created
 * with: the delta adjusts the component's own sale price, whether the component is a tick box or
 * a candidate. Making a candidate free is therefore a delta of its whole price.
 *
 * The table, its indexes and the `group_id` column carry the names
 * `ProductDropBundleCustomization1789200000000` dropped, for the reason its successor gave for
 * reusing `product_bundle_item_price`: one spelling of the idea in the schema rather than two.
 * The shape is not that one restored - `is_default` and the deltas now exist outside a group too,
 * and the delta means the component's price rather than the bundle's.
 *
 * Every existing component lands on `group_id = NULL`, which is what it already meant, so no
 * bundle in the catalog changes shape.
 */
export class ProductBundleGroups1789400000000 implements MigrationInterface {
	name = 'ProductBundleGroups1789400000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "product_bundle_group" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "label_id" integer NOT NULL, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_08f1302234d4b46d3560277d829" PRIMARY KEY ("id")); COMMENT ON TABLE "product_bundle_group" IS 'A choice offered inside a bundle; exactly one of its product-bundle-item candidates is taken'; COMMENT ON COLUMN "product_bundle_group"."product_id" IS 'The bundle this choice belongs to'; COMMENT ON COLUMN "product_bundle_group"."label_id" IS 'Term holding the multilingual prompt, e.g. "Choose your fries"'; COMMENT ON COLUMN "product_bundle_group"."position" IS 'Display order within the bundle'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_product_id" ON "product_bundle_group" ("product_id", "position")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_bundle_group_label_id" ON "product_bundle_group" ("label_id")`,
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
			`ALTER TABLE "product_bundle_item" ADD COLUMN "group_id" integer`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."group_id" IS 'The choice this component is a candidate for; NULL means it is not part of one'`,
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

		// Three of the four now read against `group_id` as well
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS 'A component of a bundle: always included, an optional tick box, or a candidate within a group'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."position" IS 'Display order within the group, or within the bundle'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."quantity" IS 'How many of the variant this component contributes, or the most the customer may take when is_optional'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."is_optional" IS 'The customer chooses whether to take this component on its own terms; refused inside a group, where the group decides'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."is_default" IS 'Preselected; meaningless on a component that is neither optional nor in a group'`,
		);
	}

	/**
	 * Rebuilds the schema, not the data. Every group is gone once this has run, and its candidates
	 * come back as plain components of the bundle - all of them always included, since a candidate
	 * carries no `is_optional` to fall back on. A swap therefore returns as both alternatives
	 * bundled together, which is why the deltas are cleared with it: each was written against the
	 * candidate's own price on the assumption only one would be taken.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DELETE FROM "product_bundle_item_price" WHERE "item_id" IN (SELECT "id" FROM "product_bundle_item" WHERE "group_id" IS NOT NULL)`,
		);

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
			`ALTER TABLE "product_bundle_group" DROP CONSTRAINT "FK_263ebca8a1a834f257faee33318"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_group" DROP CONSTRAINT "FK_b27dcfe0bbadcba2a4c9dd236de"`,
		);
		await queryRunner.query(`DROP TABLE "product_bundle_group"`);

		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS 'A component of a bundle, always included unless is_optional'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."position" IS 'Display order within the bundle'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."quantity" IS 'How many of the variant this component contributes, or the most the customer may take when is_optional'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."is_optional" IS 'The customer chooses whether to take this component; false means it is always included'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."is_default" IS 'Preselected; meaningless on a component that is not optional'`,
		);
	}
}
