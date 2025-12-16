import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AfterClient1765500308250 implements MigrationInterface {
	name = 'AfterClient1765500308250';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_a592f2df24c9d464afd71401ff6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_deb59c09715314aed1866e18a81"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" DROP CONSTRAINT "FK_fc9ce1c78c78fcde46bb1e25c47"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_49f0631f07b3d8583418d65868d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c0d597555330c0a972122bf4673"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c1bf4950dee394db4b9cad06072"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_3b5f910ac6120a81eb5d97870fa"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_8321a64a07b0586cca5295362e8"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_d0c91413c9b99b994c8a656bce1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_f2b48eda474233f6d180e41ecab"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_559e1bc4d01ef1e56d75117ab9c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_930110e92aed1778939fdbdb302"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_9f8fcad8ca5a6000b79bf3c7475"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_fd22d97428d2b0c25be95fb3567"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_073c85ed133e05241040bd70f02"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_3fb066240db56c9558a91139431"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_6002bfa369ac66d3a956119108b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_8dcd5e98bc508c778553a3b7f72"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "FK_9b27855a9c2ade186e5c55d1ec3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_07bcdbb42938702e79913c74cdb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_2bd7be52d239a1339f9dda9b8a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_30ffd61698fe0b6dae0f135625e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_ec34a22f278ed238bb550f05622"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_status"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_slug_id"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product" IS 'Stores core product information; textual content is saved in a product-content.entity'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_content" IS 'Language-specific content for products (name, slug, descriptions, meta)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."brand_status_enum" AS ENUM('active', 'inactive')`,
		);
		await queryRunner.query(
			`CREATE TABLE "brand" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "slug" character varying NOT NULL, "status" "public"."brand_status_enum" NOT NULL DEFAULT 'active', "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id")); COMMENT ON COLUMN "brand"."sort_order" IS 'Order/position of the brand in a listing'; COMMENT ON COLUMN "brand"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_brand_slug" ON "brand" ("slug") `,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."place_type_enum" AS ENUM('country', 'region', 'city')`,
		);
		await queryRunner.query(
			`CREATE TABLE "place" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "parent_id" bigint, "type" "public"."place_type_enum" NOT NULL DEFAULT 'country', "code" character(3), CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id")); COMMENT ON COLUMN "place"."code" IS 'Abbreviation'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_place_code_type_unique" ON "place" ("code", "type") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "place" IS 'Places (countries, regions, cities)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "place_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "place_id" bigint NOT NULL, "language" character(3) NOT NULL DEFAULT 'en', "name" character varying NOT NULL, "typeName" character varying NOT NULL, "details" jsonb, CONSTRAINT "PK_5af1716076889988270c39bd6ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "place_content"."typeName" IS 'ex: Country, Region, City, Oras, Judet'; COMMENT ON COLUMN "place_content"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_content_unique_per_lang" ON "place_content" ("place_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "place_content" IS 'Language-specific content for places'`,
		);
		await queryRunner.query(
			`CREATE TABLE "image" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "entity_type" text NOT NULL, "entity_id" bigint NOT NULL, "kind" text NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id")); COMMENT ON COLUMN "image"."entity_type" IS 'The type of entity this image belongs to (product, category, brand, etc.)'; COMMENT ON COLUMN "image"."entity_id" IS 'ID of the entity this image is linked to'; COMMENT ON COLUMN "image"."kind" IS 'The kind of the image (eg: primary, logo, gallery, etc)'; COMMENT ON COLUMN "image"."sort_order" IS 'Order/position of the image within the entity type'; COMMENT ON COLUMN "image"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_image_unique_main" ON "image" ("is_primary") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_type_id" ON "image" ("entity_type", "entity_id", "kind") `,
		);
		await queryRunner.query(
			`CREATE TABLE "brand_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "brand_id" bigint NOT NULL, "language" character(3) NOT NULL DEFAULT 'en', "description" text, "meta" jsonb, CONSTRAINT "PK_8e9d5488729b396e59d9144ea27" PRIMARY KEY ("id")); COMMENT ON COLUMN "brand_content"."language" IS 'Using explicit column avoids overloading \`term\` for language lookups.'; COMMENT ON COLUMN "brand_content"."meta" IS 'SEO metadata for brand pages.'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_content_unique_per_lang" ON "brand_content" ("brand_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "brand_content" IS 'Language-specific content for brands (descriptions, meta)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "image_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "image_id" bigint NOT NULL, "language" character(3) NOT NULL DEFAULT 'en', "fileProps" jsonb NOT NULL, "elementAttrs" jsonb, CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496" PRIMARY KEY ("id")); COMMENT ON COLUMN "image_content"."fileProps" IS 'Properties of the image file'; COMMENT ON COLUMN "image_content"."elementAttrs" IS 'HTML element attributes (alt, title, etc.)'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_content_unique_per_lang" ON "image_content" ("image_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "image_content" IS 'Language-specific content for images'`,
		);
		await queryRunner.query(
			`CREATE TABLE "article_category" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" bigint NOT NULL, "category_id" bigint NOT NULL, "details" jsonb, CONSTRAINT "PK_cdd234ef147c8552a8abd42bd29" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_category"."details" IS 'Reserved column for future use'`,
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
			`CREATE TABLE "article_tag" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "article_id" bigint NOT NULL, "tag_id" bigint NOT NULL, "details" jsonb, CONSTRAINT "PK_43dc2fa69a4739ce178e021d649" PRIMARY KEY ("id")); COMMENT ON COLUMN "article_tag"."details" IS 'Reserved column for future use'`,
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
			`CREATE TABLE "article_content" ("id" BIGSERIAL NOT NULL, "article_id" bigint NOT NULL, "views" bigint NOT NULL DEFAULT '0', "reading_time_minutes" integer, CONSTRAINT "REL_695e2a3fb3e8f1995d703d5b91" UNIQUE ("article_id"), CONSTRAINT "PK_5673d4aa27bd95298796b8abec7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Track article views, etc.'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."article_status_enum" AS ENUM('draft', 'published', 'archived')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."article_featuredstatus_enum" AS ENUM('nowhere', 'home', 'category')`,
		);
		await queryRunner.query(
			`CREATE TABLE "article" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."article_status_enum" NOT NULL DEFAULT 'draft', "layout" text NOT NULL, "details" jsonb, "publish_at" TIMESTAMP, "show_start_at" TIMESTAMP, "show_end_at" TIMESTAMP, "featuredStatus" "public"."article_featuredstatus_enum" NOT NULL DEFAULT 'nowhere', CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")); COMMENT ON COLUMN "article"."details" IS 'Reserved column for future use'; COMMENT ON COLUMN "article"."show_start_at" IS 'Controls when the article should be displayed'; COMMENT ON COLUMN "article"."show_end_at" IS 'Controls when the article should be displayed'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_status" ON "article" ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article" IS 'Stores core article information; textual content is saved in article-content.entity'`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "userId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "permissionId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" DROP COLUMN "orderId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "productId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "attributeLabelId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "attributeValueId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "categoryId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "labelId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "slugId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "descriptionId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "productId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "categoryId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP COLUMN "productId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP COLUMN "tagId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP COLUMN "orderId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP COLUMN "productId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "orderId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "carrierId"`,
		);
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "clientId"`);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_info"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "label_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "slug_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "description_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "details"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "productId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "labelId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "slugId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "descriptionId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "brand_id" bigint NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "client" ADD "address_info" text`);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "label" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "slug" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "description" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" bigint NOT NULL DEFAULT '0'`,
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
			`ALTER TABLE "article_content" ADD "language" character(3) NOT NULL DEFAULT 'en'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "article_content"."language" IS 'Using explicit column avoids overloading \`term\` for language lookups.'`,
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
			`ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_active"`);
		await queryRunner.query(
			`ALTER TYPE "public"."discount_type_enum" RENAME TO "discount_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_type_enum" AS ENUM('percent', 'amount')`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" ALTER COLUMN "type" TYPE "public"."discount_type_enum" USING "type"::"text"::"public"."discount_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."discount_type_enum_old"`);
		await queryRunner.query(
			`ALTER TABLE "discount" ALTER COLUMN "start_at" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" ALTER COLUMN "end_at" DROP NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ALTER COLUMN "status" SET DEFAULT 'pending'`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_country"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_country" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_region"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_region" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_city"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_city" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "REL_695e2a3fb3e8f1995d703d5b91"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_active" ON "discount" ("start_at", "end_at", "scope") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_brand_id" ON "product" ("brand_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status" ON "product" ("sale_status") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_carrier_name" ON "carrier" ("name") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_content_slug_lang" ON "product_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_8a4d5521c1ced158c13438df3df" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" ADD CONSTRAINT "FK_b7a6c70d136a872279357eef75e" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c8f119684d209b55cf5e8b42532" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_100db96f00a39987d58e0401d9e" FOREIGN KEY ("label_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_7cddb273a2cc1854447fb2b23d6" FOREIGN KEY ("slug_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_bcd9f7346d5d8927b9767bfd1a7" FOREIGN KEY ("description_id") REFERENCES "term"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_0374879a971928bc3f57eed0a59" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_2df1f83329c00e6eadde0493e16" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_ea143999ecfa6a152f2202895e2" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_400f1584bf37c21172da3b15e2d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987" FOREIGN KEY ("carrier_id") REFERENCES "carrier"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c" FOREIGN KEY ("parent_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_7f4ede2827df34706cfdba7238b" FOREIGN KEY ("address_country") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_eb9f31b5c542dc8bf39f2801056" FOREIGN KEY ("address_region") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60" FOREIGN KEY ("address_city") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_f768662205b901ba35c9c9255a0" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "FK_6699af3eb85f6ba17010c71167f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD CONSTRAINT "FK_c1718000e7e049b9841f8b4b222" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_26455b396109a0b535ddb614832" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_cdc3f155737b763c298ab080f84" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_cdc3f155737b763c298ab080f84"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_26455b396109a0b535ddb614832"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP CONSTRAINT "FK_c1718000e7e049b9841f8b4b222"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP CONSTRAINT "FK_6699af3eb85f6ba17010c71167f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_f768662205b901ba35c9c9255a0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_eb9f31b5c542dc8bf39f2801056"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_7f4ede2827df34706cfdba7238b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_400f1584bf37c21172da3b15e2d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_ea143999ecfa6a152f2202895e2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_2df1f83329c00e6eadde0493e16"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_0374879a971928bc3f57eed0a59"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_bcd9f7346d5d8927b9767bfd1a7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_7cddb273a2cc1854447fb2b23d6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_100db96f00a39987d58e0401d9e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c8f119684d209b55cf5e8b42532"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" DROP CONSTRAINT "FK_b7a6c70d136a872279357eef75e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_8a4d5521c1ced158c13438df3df"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_slug_lang"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_carrier_name"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_brand_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_active"`);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "REL_695e2a3fb3e8f1995d703d5b91" UNIQUE ("article_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_city"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_city" character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_region"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_region" character varying`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_country"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_country" character varying NOT NULL DEFAULT 'Romania'`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ALTER COLUMN "status" SET DEFAULT 'active'`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" ALTER COLUMN "end_at" SET NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" ALTER COLUMN "start_at" SET NOT NULL`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_type_enum_old" AS ENUM('percent', 'fixed_amount')`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" ALTER COLUMN "type" TYPE "public"."discount_type_enum_old" USING "type"::"text"::"public"."discount_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."discount_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."discount_type_enum_old" RENAME TO "discount_type_enum"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_active" ON "discount" ("end_at", "scope", "start_at") `,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
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
			`COMMENT ON COLUMN "article_content"."language" IS 'Using explicit column avoids overloading \`term\` for language lookups.'`,
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
			`ALTER TABLE "product_content" DROP COLUMN "description"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "slug"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "label"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_info"`,
		);
		await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "brand_id"`);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" bigint NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "descriptionId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "slugId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "labelId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "productId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "details" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "description_id" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "slug_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "label_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_info" character varying`,
		);
		await queryRunner.query(`ALTER TABLE "order" ADD "clientId" bigint`);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "carrierId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "orderId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "productId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "orderId" bigint`,
		);
		await queryRunner.query(`ALTER TABLE "product_tag" ADD "tagId" bigint`);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD "productId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "categoryId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "productId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "descriptionId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "slugId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "labelId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "categoryId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "attributeValueId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "attributeLabelId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "productId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" ADD "orderId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "permissionId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "userId" bigint`,
		);
		await queryRunner.query(`COMMENT ON TABLE "article" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_status"`);
		await queryRunner.query(`DROP TABLE "article"`);
		await queryRunner.query(
			`DROP TYPE "public"."article_featuredstatus_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."article_status_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "article_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(`DROP TABLE "article_content"`);
		await queryRunner.query(`COMMENT ON TABLE "article_tag" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_tag_id"`);
		await queryRunner.query(`DROP TABLE "article_tag"`);
		await queryRunner.query(`COMMENT ON TABLE "article_category" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_category_id"`,
		);
		await queryRunner.query(`DROP TABLE "article_category"`);
		await queryRunner.query(`COMMENT ON TABLE "image_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "image_content"`);
		await queryRunner.query(`COMMENT ON TABLE "brand_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "brand_content"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_unique_main"`);
		await queryRunner.query(`DROP TABLE "image"`);
		await queryRunner.query(`COMMENT ON TABLE "place_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "place_content"`);
		await queryRunner.query(`COMMENT ON TABLE "place" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_code_type_unique"`,
		);
		await queryRunner.query(`DROP TABLE "place"`);
		await queryRunner.query(`DROP TYPE "public"."place_type_enum"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_brand_slug"`);
		await queryRunner.query(`DROP TABLE "brand"`);
		await queryRunner.query(`DROP TYPE "public"."brand_status_enum"`);
		await queryRunner.query(
			`COMMENT ON TABLE "product_content" IS 'Language-specific content for products (name, slug, descriptions, SEO)'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product" IS 'Stores core product information; textual content is saved in a separate entity'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_content_slug_id" ON "product_content" ("slug_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_status" ON "product" ("sale_status") `,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_ec34a22f278ed238bb550f05622" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_30ffd61698fe0b6dae0f135625e" FOREIGN KEY ("descriptionId") REFERENCES "term"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_2bd7be52d239a1339f9dda9b8a2" FOREIGN KEY ("slugId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_07bcdbb42938702e79913c74cdb" FOREIGN KEY ("labelId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "FK_9b27855a9c2ade186e5c55d1ec3" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_8dcd5e98bc508c778553a3b7f72" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_6002bfa369ac66d3a956119108b" FOREIGN KEY ("carrierId") REFERENCES "carrier"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_3fb066240db56c9558a91139431" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_073c85ed133e05241040bd70f02" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_fd22d97428d2b0c25be95fb3567" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_9f8fcad8ca5a6000b79bf3c7475" FOREIGN KEY ("tagId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_930110e92aed1778939fdbdb302" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_559e1bc4d01ef1e56d75117ab9c" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_f2b48eda474233f6d180e41ecab" FOREIGN KEY ("labelId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_d0c91413c9b99b994c8a656bce1" FOREIGN KEY ("descriptionId") REFERENCES "term"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_8321a64a07b0586cca5295362e8" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_3b5f910ac6120a81eb5d97870fa" FOREIGN KEY ("slugId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c1bf4950dee394db4b9cad06072" FOREIGN KEY ("attributeValueId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c0d597555330c0a972122bf4673" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_49f0631f07b3d8583418d65868d" FOREIGN KEY ("attributeLabelId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" ADD CONSTRAINT "FK_fc9ce1c78c78fcde46bb1e25c47" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_deb59c09715314aed1866e18a81" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_a592f2df24c9d464afd71401ff6" FOREIGN KEY ("permissionId") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}
}
