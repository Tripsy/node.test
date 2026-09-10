import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The `cart` and `cart_item` tables.
 *
 * Hand-trimmed from the generated output. The generator also proposed dropping
 * `document_series.padding` / `format`, dropping `IDX_product_availability_day_unique` and
 * renaming two foreign keys - pre-existing drift between the entities and the database that has
 * nothing to do with this feature, and would have been destructive to carry along.
 */
export class Cart1790300000000 implements MigrationInterface {
	name = 'Cart1790300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."cart_status_enum" AS ENUM('active', 'converted', 'abandoned')`,
		);

		await queryRunner.query(
			`CREATE TABLE "cart" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"token" uuid NOT NULL,
				"user_id" integer,
				"status" "public"."cart_status_enum" NOT NULL DEFAULT 'active',
				"order_id" integer,
				"currency" character(3) NOT NULL DEFAULT 'RON',
				"expires_at" TIMESTAMP NOT NULL,
				CONSTRAINT "PK_cart" PRIMARY KEY ("id")
			)`,
		);

		await queryRunner.query(
			`COMMENT ON TABLE "cart" IS 'Stores shopping carts, for guests and members alike'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "cart"."token" IS 'Opaque handle held by the client, guest identity'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "cart"."currency" IS 'Market the cart is priced in'`,
		);

		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_cart_token" ON "cart" ("token")`,
		);
		// One live cart per member; the terminal statuses leave the slot free again.
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_cart_user_active" ON "cart" ("user_id") WHERE user_id IS NOT NULL AND status = 'active' AND deleted_at IS NULL`,
		);
		// The cleanup cron's whole query.
		await queryRunner.query(
			`CREATE INDEX "IDX_cart_expires_at" ON "cart" ("expires_at") WHERE status = 'active' AND deleted_at IS NULL`,
		);
		// The referencing side of `order_id`, which Postgres does not index on its own.
		await queryRunner.query(
			`CREATE INDEX "IDX_cart_order_id" ON "cart" ("order_id") WHERE order_id IS NOT NULL`,
		);

		await queryRunner.query(
			`CREATE TABLE "cart_item" (
				"id" SERIAL NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"cart_id" integer NOT NULL,
				"variant_id" integer NOT NULL,
				"product_id" integer NOT NULL,
				"quantity" numeric(12,2) NOT NULL,
				"options" jsonb,
				"options_hash" character varying(64) NOT NULL DEFAULT '',
				"notes" text,
				CONSTRAINT "CHK_cart_item_quantity" CHECK ((quantity > 0)),
				CONSTRAINT "PK_cart_item" PRIMARY KEY ("id")
			)`,
		);

		await queryRunner.query(
			`COMMENT ON TABLE "cart_item" IS 'Stores cart lines; deliberately holds no prices'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "cart_item"."options" IS 'Chosen product_option ids, ascending'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "cart_item"."options_hash" IS 'Hash of the ascending option ids, empty when there are none'`,
		);

		await queryRunner.query(
			`CREATE INDEX "IDX_cart_item_cart_id" ON "cart_item" ("cart_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cart_item_variant_id" ON "cart_item" ("variant_id")`,
		);
		// Re-adding the same configuration increments the line it matches.
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_cart_item_line" ON "cart_item" ("cart_id", "variant_id", "options_hash") WHERE deleted_at IS NULL`,
		);

		await queryRunner.query(
			`ALTER TABLE "cart" ADD CONSTRAINT "FK_cart_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart" ADD CONSTRAINT "FK_cart_order" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart_item" ADD CONSTRAINT "FK_cart_item_cart" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		// Composite, so a line cannot name a variant belonging to a different product.
		await queryRunner.query(
			`ALTER TABLE "cart_item" ADD CONSTRAINT "FK_cart_item_variant" FOREIGN KEY ("variant_id", "product_id") REFERENCES "product_variant"("id","product_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "cart_item" DROP CONSTRAINT "FK_cart_item_variant"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart_item" DROP CONSTRAINT "FK_cart_item_cart"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart" DROP CONSTRAINT "FK_cart_order"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart" DROP CONSTRAINT "FK_cart_user"`,
		);

		await queryRunner.query(`DROP TABLE "cart_item"`);
		await queryRunner.query(`DROP TABLE "cart"`);
		await queryRunner.query(`DROP TYPE "public"."cart_status_enum"`);
	}
}
