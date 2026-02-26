import type { MigrationInterface, QueryRunner } from 'typeorm';

export class BrandUpdate1772071527506 implements MigrationInterface {
	name = 'BrandUpdate1772071527506';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "article" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."article_status_enum" NOT NULL DEFAULT 'draft', "layout" text NOT NULL, "details" jsonb, "publish_at" TIMESTAMP, "show_start_at" TIMESTAMP, "show_end_at" TIMESTAMP, "featuredStatus" "public"."article_featuredstatus_enum" NOT NULL DEFAULT 'nowhere', CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")); COMMENT ON COLUMN "article"."details" IS 'Reserved column for future use'; COMMENT ON COLUMN "article"."show_start_at" IS 'Controls when the article should be displayed'; COMMENT ON COLUMN "article"."show_end_at" IS 'Controls when the article should be displayed'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_status" ON "article" ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article" IS 'Stores core article information; textual content is saved in article-content.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "article_category" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" integer NOT NULL, "category_id" integer NOT NULL, "details" jsonb, CONSTRAINT "PK_cdd234ef147c8552a8abd42bd29" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_category"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_category_category_id" ON "article_category" ("category_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_category_unique" ON "article_category" ("article_id", "category_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_category" IS 'Link articles to categories'`,
		);
		await queryRunner.query(
			`CREATE TABLE "article_content" ("id" SERIAL NOT NULL, "article_id" integer NOT NULL, "views" integer NOT NULL DEFAULT '0', "reading_time_minutes" integer, CONSTRAINT "REL_695e2a3fb3e8f1995d703d5b91" UNIQUE ("article_id"), CONSTRAINT "PK_5673d4aa27bd95298796b8abec7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Track article views, etc.'`,
		);
		await queryRunner.query(
			`CREATE TABLE "article_tag" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" integer NOT NULL, "tag_id" integer NOT NULL, "details" jsonb, CONSTRAINT "PK_43dc2fa69a4739ce178e021d649" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_tag"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_tag_tag_id" ON "article_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_tag_unique" ON "article_tag" ("article_id", "tag_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_tag" IS 'Links articles to tag terms'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."brand_type_enum" AS ENUM('product')`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand" ADD "type" "public"."brand_type_enum" NOT NULL DEFAULT 'product'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "brand"."type" IS 'Specifies the entity type this brand belongs to'`,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" ADD "deleted_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "updated_at" TIMESTAMP DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "deleted_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "language" character varying(3) NOT NULL DEFAULT 'en'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "slug" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "author" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."author" IS 'Author details'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "title" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "brief" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content_blocks" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "meta" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."meta" IS 'SEO metadata for article pages.'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "order_shipping"."discount" IS 'Array of discount snapshots applied'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "order_product"."discount" IS 'Array of discount snapshots applied'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "invoice"."discount" IS 'Array of discount snapshots applied'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "REL_695e2a3fb3e8f1995d703d5b91"`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_26455b396109a0b535ddb614832" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_cdc3f155737b763c298ab080f84" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_cdc3f155737b763c298ab080f84"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_26455b396109a0b535ddb614832"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "REL_695e2a3fb3e8f1995d703d5b91" UNIQUE ("article_id")`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "invoice"."discount" IS 'Array of discount snapshots applied to this order'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "order_product"."discount" IS 'Array of discount snapshots applied to this product line'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "order_shipping"."discount" IS 'Array of discount snapshots applied to this order'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."meta" IS 'SEO metadata for article pages.'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "meta"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."content_blocks" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content_blocks"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "brief"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "title"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."author" IS 'Author details'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "author"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "slug"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "language"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "deleted_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "updated_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "created_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" DROP COLUMN "deleted_at"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "brand"."type" IS 'Specifies the entity type this brand belongs to'`,
		);
		await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "type"`);
		await queryRunner.query(`DROP TYPE "public"."brand_type_enum"`);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(`COMMENT ON TABLE "article_tag" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_tag_id"`);
		await queryRunner.query(`DROP TABLE "article_tag"`);
		await queryRunner.query(`COMMENT ON TABLE "article_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(`DROP TABLE "article_content"`);
		await queryRunner.query(`COMMENT ON TABLE "article_category" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_category_id"`,
		);
		await queryRunner.query(`DROP TABLE "article_category"`);
		await queryRunner.query(`COMMENT ON TABLE "article" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_status"`);
		await queryRunner.query(`DROP TABLE "article"`);
	}
}
