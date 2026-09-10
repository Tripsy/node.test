import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gives a bundle components the customer chooses: `is_optional` marks a component as a tick box
 * rather than part of the kit, `is_default` preselects it, and `product_bundle_item_price` carries
 * the signed per-currency adjustment applied to that component's own price when it is taken.
 *
 * `quantity` changes meaning on such a row: on a component that is always included it is how many
 * the bundle contains, and on an optional one it is the most the customer may take. No column
 * bounds the optional set as a whole - each component carries its own ceiling.
 *
 * The delta means something narrower than the column of the same name that
 * `ProductDropBundleCustomization1789200000000` removed: that one was added to the *bundle* price
 * and ignored the component's own, where this one adjusts the component price the bundle total
 * sums. The table name, the `item_id` key and the unique index are deliberately the ones that
 * migration dropped, so the schema carries one spelling of the idea rather than two.
 *
 * Every existing row lands on `is_optional = false`, which is what it already meant, so no bundle
 * in the catalog changes shape.
 */
export class ProductBundleOptionalComponents1789300000000
	implements MigrationInterface
{
	name = 'ProductBundleOptionalComponents1789300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD COLUMN "is_optional" boolean NOT NULL DEFAULT false`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."is_optional" IS 'The customer chooses whether to take this component; false means it is always included'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" ADD COLUMN "is_default" boolean NOT NULL DEFAULT false`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."is_default" IS 'Preselected; meaningless on a component that is not optional'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS 'A component of a bundle, always included unless is_optional'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."quantity" IS 'How many of the variant this component contributes, or the most the customer may take when is_optional'`,
		);

		await queryRunner.query(
			`CREATE TABLE "product_bundle_item_price" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "item_id" integer NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "price_delta" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_7a3e4166f3ca6678a53698aa79e" PRIMARY KEY ("id")); COMMENT ON TABLE "product_bundle_item_price" IS 'Per-currency price delta for an optional bundle component; excludes VAT, like product-price.entity'; COMMENT ON COLUMN "product_bundle_item_price"."price_delta" IS 'Added to the component price when it is taken; negative subtracts'`,
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

	/**
	 * Rebuilds the schema, not the data. Every delta and every optional flag is gone once this has
	 * run - a bundle that offered a choice comes back as the flat list of all its components, with
	 * the optional ones now always included and priced at the bundle's own figure.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item_price" DROP CONSTRAINT "FK_acfab32b10d24fe85d0b91b996c"`,
		);
		await queryRunner.query(`DROP TABLE "product_bundle_item_price"`);

		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP COLUMN "is_default"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_bundle_item" DROP COLUMN "is_optional"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_bundle_item" IS 'A component always included in a bundle'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "product_bundle_item"."quantity" IS 'How many of the variant this component contributes'`,
		);
	}
}
