import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The `review` table: the score and the text a buyer leaves on a product, moderated the way a
 * comment is.
 *
 * Written by hand from the generated output, keeping only the statements this feature owns - the
 * generator also picked up drift the dev database carries from other branches (a foreign-key
 * rename on `term_content` and `discount_target`, `document_series` columns, an availability
 * index), none of which belongs in a migration named for this feature.
 *
 * `rating` is jsonb rather than four columns: the dimensions are a list the catalog decides, and a
 * fifth one is then a check constraint rather than a table rewrite. `CHK_review_rating` holds the
 * shape - at least one known key, no unknown key, each value a number in range - and `rating_avg`
 * is the denormalized average the listings and filters actually read.
 *
 * The variant foreign key is **composite**, over `(variant_id, product_id)` at once, so a review
 * cannot name a variant belonging to a different product. Postgres skips a MATCH SIMPLE composite
 * key when any of its columns is null, which is what leaves `variant_id` free to stay unset.
 */
export class Review1790100000000 implements MigrationInterface {
	name = 'Review1790100000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."review_status_enum" AS ENUM('pending', 'rejected', 'spam', 'approved')`,
		);
		await queryRunner.query(
			`CREATE TABLE "review" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" integer NOT NULL, "variant_id" integer, "rating" jsonb NOT NULL, "rating_avg" numeric(3,2) NOT NULL, "content" text NOT NULL, "status" "public"."review_status_enum" NOT NULL DEFAULT 'pending', "user_id" integer NOT NULL, "is_pinned" boolean NOT NULL DEFAULT false, "is_verified" boolean NOT NULL DEFAULT false, "moderated_at" TIMESTAMP, "moderated_by" integer, "moderation_reason" character varying, CONSTRAINT "CHK_review_rating" CHECK (jsonb_typeof(rating) = 'object'
	 AND rating - 'quality' - 'price' - 'service' - 'delivery' = '{}'::jsonb
	 AND rating ?| array['quality', 'price', 'service', 'delivery']
	 AND (NOT rating ? 'quality' OR (jsonb_typeof(rating->'quality') = 'number' AND rating->'quality' BETWEEN '1'::jsonb AND '5'::jsonb))
	 AND (NOT rating ? 'price' OR (jsonb_typeof(rating->'price') = 'number' AND rating->'price' BETWEEN '1'::jsonb AND '5'::jsonb))
	 AND (NOT rating ? 'service' OR (jsonb_typeof(rating->'service') = 'number' AND rating->'service' BETWEEN '1'::jsonb AND '5'::jsonb))
	 AND (NOT rating ? 'delivery' OR (jsonb_typeof(rating->'delivery') = 'number' AND rating->'delivery' BETWEEN '1'::jsonb AND '5'::jsonb))), CONSTRAINT "CHK_review_rating_avg_range" CHECK (rating_avg BETWEEN 1 AND 5), CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id")); COMMENT ON COLUMN "review"."rating" IS 'Scores out of 5, keyed by dimension'; COMMENT ON COLUMN "review"."is_verified" IS 'Verified buyer'; COMMENT ON COLUMN "review"."moderated_by" IS 'Moderator user ID'; COMMENT ON COLUMN "review"."moderation_reason" IS 'Reason for moderation action'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "review" IS 'Stores product reviews'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_review_user" ON "review" ("product_id", "user_id") WHERE deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_review_variant" ON "review" ("variant_id", "created_at") WHERE variant_id IS NOT NULL AND status = 'approved' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_review_user_status" ON "review" ("user_id", "status")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_review_moderation" ON "review" ("created_at") WHERE status = 'pending' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_review_product_rating" ON "review" ("product_id", "rating_avg") WHERE status = 'approved' AND deleted_at IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_review_product" ON "review" ("product_id", "status", "created_at")`,
		);
		await queryRunner.query(
			`ALTER TABLE "review" ADD CONSTRAINT "FK_26b533e15b5f2334c96339a1f08" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "review" ADD CONSTRAINT "FK_f524b9034cb0e4297fc181ae985" FOREIGN KEY ("variant_id", "product_id") REFERENCES "product_variant"("id","product_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "review" ADD CONSTRAINT "FK_81446f2ee100305f42645d4d6c2" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "review" DROP CONSTRAINT "FK_81446f2ee100305f42645d4d6c2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "review" DROP CONSTRAINT "FK_f524b9034cb0e4297fc181ae985"`,
		);
		await queryRunner.query(
			`ALTER TABLE "review" DROP CONSTRAINT "FK_26b533e15b5f2334c96339a1f08"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_review_product"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_review_product_rating"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_review_moderation"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_review_user_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_review_variant"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_review_user"`);
		await queryRunner.query(`DROP TABLE "review"`);
		await queryRunner.query(`DROP TYPE "public"."review_status_enum"`);
	}
}
