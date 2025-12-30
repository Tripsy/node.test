import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoryUpdate21766972996756 implements MigrationInterface {
	name = 'CategoryUpdate21766972996756';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Language-specific content for articles (title, slug, brief, content, meta)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "subscription_evidence" ("id" SERIAL NOT NULL, "subscription_id" integer NOT NULL, "invoice_id" integer NOT NULL, "status" "public"."subscription_evidence_status_enum" NOT NULL, "response_data" jsonb, "fail_reason" text, "recorded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_751c8a105d4627fc564ab7e2fed" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscription_evidence"."response_data" IS 'Response data from the payment gateway. For example: { "transaction_id": "1234567890" }'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_evidence_subscription_id" ON "subscription_evidence" ("subscription_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_evidence_invoice_id" ON "subscription_evidence" ("invoice_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_evidence_status" ON "subscription_evidence" ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription_evidence" IS 'Used to track renewal attempts for subscriptions.'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "created_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "updated_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "deleted_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "language"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "slug"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "author"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "title"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "brief"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "content_blocks"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "meta"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
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
			`ALTER TABLE "logs"."log_data" DROP CONSTRAINT "PK_ee6ddd7720fe93171a6b62e4be6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" ADD CONSTRAINT "PK_ee6ddd7720fe93171a6b62e4be6" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_7f4ede2827df34706cfdba7238b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_da8137d639bcd3bb5a1cac23506"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca"`,
		);
		await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "id"`);
		await queryRunner.query(`ALTER TABLE "place" ADD "id" SERIAL NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_parent_id"`);
		await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "parent_id"`);
		await queryRunner.query(`ALTER TABLE "place" ADD "parent_id" integer`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "PK_5af1716076889988270c39bd6ff"`,
		);
		await queryRunner.query(`ALTER TABLE "place_content" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "PK_5af1716076889988270c39bd6ff" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP COLUMN "place_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD "place_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4"`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_entity_id_action"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP CONSTRAINT "PK_837ee3d001208e2b7400e7a0487"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD CONSTRAINT "PK_837ee3d001208e2b7400e7a0487" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP COLUMN "entity_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD "entity_id" integer NOT NULL`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_history_auth_id"`);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP COLUMN "auth_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD "auth_id" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_604c2b655029e47091f671ba875"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_ab3c66669facfe429164e60ab82"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_940d49a105d50bbd616be540013"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760"`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "id" SERIAL NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_8a4d5521c1ced158c13438df3df"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_user_permission_permission"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "PK_a7326749e773c740a7104634a77"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "PK_a7326749e773c740a7104634a77" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "user_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "permission_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "permission_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" DROP CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" ADD CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" DROP CONSTRAINT "PK_d05d8712e429673e459e7f1cddb"`,
		);
		await queryRunner.query(`ALTER TABLE "discount" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "discount" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" ADD CONSTRAINT "PK_d05d8712e429673e459e7f1cddb" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_2df1f83329c00e6eadde0493e16"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "FK_4aa1348fc4b7da9bef0fae8ff48"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "FK_6a22002acac4976977b1efd114a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03"`,
		);
		await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "category" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP COLUMN "parent_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD "parent_id" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "PK_96da49381769303a6515a8785c7"`,
		);
		await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_country"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_country" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_region"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_region" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_city"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_city" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "PK_266faccfe1a64cd9a8e5479deed"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "PK_266faccfe1a64cd9a8e5479deed" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "category_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987"`,
		);
		await queryRunner.query(
			`ALTER TABLE "carrier" DROP CONSTRAINT "PK_f615ebd1906f0270d41b3a5a8b0"`,
		);
		await queryRunner.query(`ALTER TABLE "carrier" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "carrier" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "carrier" ADD CONSTRAINT "PK_f615ebd1906f0270d41b3a5a8b0" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" DROP CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" ADD CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP CONSTRAINT "PK_fc59283e1a31da3ce216089305b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD CONSTRAINT "PK_fc59283e1a31da3ce216089305b" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_mail_queue_template_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "template_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "template_id" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "PK_d4901111d598239fd13e230f618"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "PK_d4901111d598239fd13e230f618" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_recovery_user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD "user_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "PK_a55842d3341d42534e39f85e931"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "PK_a55842d3341d42534e39f85e931" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_token_user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD "user_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_cdc3f155737b763c298ab080f84"`,
		);
		await queryRunner.query(
			`ALTER TABLE "term" DROP CONSTRAINT "PK_55b0479f0743f2e5d5ec414821e"`,
		);
		await queryRunner.query(`ALTER TABLE "term" DROP COLUMN "id"`);
		await queryRunner.query(`ALTER TABLE "term" ADD "id" SERIAL NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "term" ADD CONSTRAINT "PK_55b0479f0743f2e5d5ec414821e" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_32ddbd23837b1229248a5cc232b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d"`,
		);
		await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP COLUMN "order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD "order_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD "user_id" integer`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "subscription"."user_id" IS 'When subscription is assigned to a user (virtual services)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c8f119684d209b55cf5e8b42532"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_0374879a971928bc3f57eed0a59"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_400f1584bf37c21172da3b15e2d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_f768662205b901ba35c9c9255a0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "PK_bebc9158e480b949565b4dc7a82"`,
		);
		await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_brand_id"`);
		await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "brand_id"`);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "brand_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "product_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" DROP CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab"`,
		);
		await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "payment" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" ADD CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_payment_invoice_id"`);
		await queryRunner.query(
			`ALTER TABLE "payment" DROP COLUMN "invoice_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" ADD "invoice_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_unique"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "product_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "attribute_label_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "attribute_label_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "attribute_value_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "attribute_value_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_08f57f381c1c316fd7bc0d8b3e6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "PK_9e1174bf865646026aba95d2ae0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "PK_9e1174bf865646026aba95d2ae0" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "order_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_carrier_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "carrier_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "carrier_id" integer`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_unique"`);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "PK_1439455c6528caa94fcc8564fda"`,
		);
		await queryRunner.query(`ALTER TABLE "product_tag" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "PK_1439455c6528caa94fcc8564fda" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD "product_id" integer NOT NULL`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_tag_id"`);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP COLUMN "tag_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD "tag_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" DROP CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_ea143999ecfa6a152f2202895e2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "PK_1031171c13130102495201e3e20"`,
		);
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "id"`);
		await queryRunner.query(`ALTER TABLE "order" ADD "id" SERIAL NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_id"`);
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "client_id"`);
		await queryRunner.query(
			`ALTER TABLE "order" ADD "client_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_unique"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "product_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "category_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_66811564f24eb71ac15e5ea124b"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_unique"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "PK_07c1c05392d97859bb43947dfc7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "PK_07c1c05392d97859bb43947dfc7" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_order_product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "order_product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "order_product_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "order_shipping_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "order_shipping_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "PK_539ede39e518562dfdadfddb492"`,
		);
		await queryRunner.query(`ALTER TABLE "order_product" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP COLUMN "order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "order_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "product_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP CONSTRAINT "FK_6699af3eb85f6ba17010c71167f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand" DROP CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f"`,
		);
		await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "id"`);
		await queryRunner.query(`ALTER TABLE "brand" ADD "id" SERIAL NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "brand" ADD CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" DROP CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18"`,
		);
		await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_order_id"`);
		await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "order_id"`);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD "order_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP CONSTRAINT "PK_459b846bf883b0de2833b411c19"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD CONSTRAINT "PK_459b846bf883b0de2833b411c19" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP CONSTRAINT "PK_8e9d5488729b396e59d9144ea27"`,
		);
		await queryRunner.query(`ALTER TABLE "brand_content" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "PK_8e9d5488729b396e59d9144ea27" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP COLUMN "brand_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD "brand_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP CONSTRAINT "FK_c1718000e7e049b9841f8b4b222"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(
			`ALTER TABLE "image" DROP CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3"`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "id"`);
		await queryRunner.query(`ALTER TABLE "image" ADD "id" SERIAL NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "image" ADD CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "entity_id"`);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "entity_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image"."entity_id" IS 'ID of the entity this image is linked to'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "PK_5673d4aa27bd95298796b8abec7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "PK_5673d4aa27bd95298796b8abec7" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "article_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "article_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c" UNIQUE ("article_id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496"`,
		);
		await queryRunner.query(`ALTER TABLE "image_content" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "image_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "image_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "FK_26455b396109a0b535ddb614832"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article" DROP CONSTRAINT "PK_40808690eb7b915046558c0f81b"`,
		);
		await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "article" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article" ADD CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_unique"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "PK_cdd234ef147c8552a8abd42bd29"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "PK_cdd234ef147c8552a8abd42bd29" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP COLUMN "article_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD "article_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP COLUMN "category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD "category_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_unique"`);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "PK_43dc2fa69a4739ce178e021d649"`,
		);
		await queryRunner.query(`ALTER TABLE "article_tag" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD "id" SERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "PK_43dc2fa69a4739ce178e021d649" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP COLUMN "article_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD "article_id" integer NOT NULL`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_tag_id"`);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP COLUMN "tag_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD "tag_id" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_6a22002acac4976977b1efd114a" PRIMARY KEY ("id_descendant")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_4aa1348fc4b7da9bef0fae8ff4"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP COLUMN "id_ancestor"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD "id_ancestor" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_6a22002acac4976977b1efd114a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY ("id_descendant", "id_ancestor")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_4aa1348fc4b7da9bef0fae8ff48" PRIMARY KEY ("id_ancestor")`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_6a22002acac4976977b1efd114"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP COLUMN "id_descendant"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD "id_descendant" integer NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_4aa1348fc4b7da9bef0fae8ff48"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY ("id_ancestor", "id_descendant")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_parent_id" ON "place" ("parent_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_place_content_unique_per_lang" ON "place_content" ("place_id", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_auth_id" ON "logs"."log_history" ("auth_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_entity_id_action" ON "logs"."log_history" ("entity_id", "entity", "action") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_user_permission_permission" ON "user_permission" ("user_id", "permission_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_category_content_unique" ON "category_content" ("category_id", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_template_id" ON "system"."mail_queue" ("template_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_recovery_user_id" ON "system"."account_recovery" ("user_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_token_user_id" ON "system"."account_token" ("user_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_subscription_order_id" ON "subscription" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_brand_id" ON "product" ("brand_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_content_unique_per_lang" ON "product_content" ("product_id", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_payment_invoice_id" ON "payment" ("invoice_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_product_id" ON "product_attribute" ("product_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_attribute_unique" ON "product_attribute" ("product_id", "attribute_label_id", "attribute_value_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_order_id" ON "order_shipping" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_carrier_id" ON "order_shipping" ("carrier_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_tag_id" ON "product_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_tag_unique" ON "product_tag" ("product_id", "tag_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_client_id" ON "order" ("client_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_category_id" ON "product_category" ("category_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_category_unique" ON "product_category" ("product_id", "category_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_product_order_product_id" ON "order_shipping_product" ("order_product_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_shipping_product_unique" ON "order_shipping_product" ("order_shipping_id", "order_product_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_order_id" ON "order_product" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_product_id" ON "order_product" ("product_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_order_id" ON "invoice" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_content_unique_per_lang" ON "brand_content" ("brand_id", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_type_id" ON "image" ("entity_type", "entity_id", "kind") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_content_unique_per_lang" ON "image_content" ("image_id", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_category_category_id" ON "article_category" ("category_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_category_unique" ON "article_category" ("article_id", "category_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_tag_tag_id" ON "article_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_tag_unique" ON "article_tag" ("article_id", "tag_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4aa1348fc4b7da9bef0fae8ff4" ON "category_closure" ("id_ancestor") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_6a22002acac4976977b1efd114" ON "category_closure" ("id_descendant") `,
		);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c" FOREIGN KEY ("parent_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4" FOREIGN KEY ("auth_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_8a4d5521c1ced158c13438df3df" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_7f4ede2827df34706cfdba7238b" FOREIGN KEY ("address_country") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_da8137d639bcd3bb5a1cac23506" FOREIGN KEY ("address_region") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60" FOREIGN KEY ("address_city") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d" FOREIGN KEY ("template_id") REFERENCES "system"."template"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_604c2b655029e47091f671ba875" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_ab3c66669facfe429164e60ab82" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_32ddbd23837b1229248a5cc232b" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" ADD CONSTRAINT "FK_cc9eb4c92df6a79526d30655c1f" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_f768662205b901ba35c9c9255a0" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987" FOREIGN KEY ("carrier_id") REFERENCES "carrier"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_0374879a971928bc3f57eed0a59" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_2df1f83329c00e6eadde0493e16" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "FK_66811564f24eb71ac15e5ea124b" FOREIGN KEY ("order_product_id") REFERENCES "order_product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "FK_08f57f381c1c316fd7bc0d8b3e6" FOREIGN KEY ("order_shipping_id") REFERENCES "order_shipping"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_ea143999ecfa6a152f2202895e2" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_400f1584bf37c21172da3b15e2d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "FK_6699af3eb85f6ba17010c71167f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
			`ALTER TABLE "category_closure" ADD CONSTRAINT "FK_4aa1348fc4b7da9bef0fae8ff48" FOREIGN KEY ("id_ancestor") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "FK_6a22002acac4976977b1efd114a" FOREIGN KEY ("id_descendant") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "FK_6a22002acac4976977b1efd114a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "FK_4aa1348fc4b7da9bef0fae8ff48"`,
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
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP CONSTRAINT "FK_6699af3eb85f6ba17010c71167f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" DROP CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_400f1584bf37c21172da3b15e2d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_ea143999ecfa6a152f2202895e2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_08f57f381c1c316fd7bc0d8b3e6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "FK_66811564f24eb71ac15e5ea124b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_2df1f83329c00e6eadde0493e16"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_0374879a971928bc3f57eed0a59"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99"`,
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
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_f768662205b901ba35c9c9255a0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_evidence" DROP CONSTRAINT "FK_cc9eb4c92df6a79526d30655c1f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_940d49a105d50bbd616be540013"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_32ddbd23837b1229248a5cc232b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_ab3c66669facfe429164e60ab82"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_604c2b655029e47091f671ba875"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_da8137d639bcd3bb5a1cac23506"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "FK_7f4ede2827df34706cfdba7238b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_8a4d5521c1ced158c13438df3df"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_6a22002acac4976977b1efd114"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_4aa1348fc4b7da9bef0fae8ff4"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_tag_tag_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_category_category_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_order_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_order_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_product_order_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_category_id"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_tag_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_carrier_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_order_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_product_id"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_payment_invoice_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_brand_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_order_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_token_user_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_recovery_user_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_mail_queue_template_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_user_permission_permission"`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_entity_id_action"`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_history_auth_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_parent_id"`);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_4aa1348fc4b7da9bef0fae8ff48" PRIMARY KEY ("id_ancestor")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP COLUMN "id_descendant"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD "id_descendant" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_6a22002acac4976977b1efd114" ON "category_closure" ("id_descendant") `,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_4aa1348fc4b7da9bef0fae8ff48"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY ("id_descendant", "id_ancestor")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_6a22002acac4976977b1efd114a" PRIMARY KEY ("id_descendant")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP COLUMN "id_ancestor"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD "id_ancestor" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4aa1348fc4b7da9bef0fae8ff4" ON "category_closure" ("id_ancestor") `,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" DROP CONSTRAINT "PK_6a22002acac4976977b1efd114a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY ("id_ancestor", "id_descendant")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP COLUMN "tag_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD "tag_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_tag_tag_id" ON "article_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP COLUMN "article_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD "article_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" DROP CONSTRAINT "PK_43dc2fa69a4739ce178e021d649"`,
		);
		await queryRunner.query(`ALTER TABLE "article_tag" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "PK_43dc2fa69a4739ce178e021d649" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_tag_unique" ON "article_tag" ("article_id", "tag_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c" UNIQUE ("article_id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP COLUMN "category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD "category_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_category_category_id" ON "article_category" ("category_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP COLUMN "article_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD "article_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP CONSTRAINT "PK_cdd234ef147c8552a8abd42bd29"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "PK_cdd234ef147c8552a8abd42bd29" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_category_unique" ON "article_category" ("article_id", "category_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article" DROP CONSTRAINT "PK_40808690eb7b915046558c0f81b"`,
		);
		await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "article" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article" ADD CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_26455b396109a0b535ddb614832" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_0f261c64d873b8dc5a26ecab44e" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP COLUMN "image_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "image_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496"`,
		);
		await queryRunner.query(`ALTER TABLE "image_content" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_content_unique_per_lang" ON "image_content" ("image_id", "language") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "article_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "article_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "PK_5673d4aa27bd95298796b8abec7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "PK_5673d4aa27bd95298796b8abec7" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "image"."entity_id" IS 'ID of the entity this image is linked to'`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "entity_id"`);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "entity_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" DROP CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3"`,
		);
		await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "image" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" ADD CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_type_id" ON "image" ("entity_id", "entity_type", "kind") `,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD CONSTRAINT "FK_c1718000e7e049b9841f8b4b222" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP COLUMN "brand_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD "brand_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" DROP CONSTRAINT "PK_8e9d5488729b396e59d9144ea27"`,
		);
		await queryRunner.query(`ALTER TABLE "brand_content" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "PK_8e9d5488729b396e59d9144ea27" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_content_unique_per_lang" ON "brand_content" ("brand_id", "language") `,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP CONSTRAINT "PK_459b846bf883b0de2833b411c19"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD CONSTRAINT "PK_459b846bf883b0de2833b411c19" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "order_id"`);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD "order_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_order_id" ON "invoice" ("order_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" DROP CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18"`,
		);
		await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand" DROP CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f"`,
		);
		await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "brand" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand" ADD CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "FK_6699af3eb85f6ba17010c71167f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "product_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_product_id" ON "order_product" ("product_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP COLUMN "order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "order_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_order_id" ON "order_product" ("order_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "PK_539ede39e518562dfdadfddb492"`,
		);
		await queryRunner.query(`ALTER TABLE "order_product" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "order_shipping_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "order_shipping_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "order_product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "order_product_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_product_order_product_id" ON "order_shipping_product" ("order_product_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP CONSTRAINT "PK_07c1c05392d97859bb43947dfc7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "PK_07c1c05392d97859bb43947dfc7" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_shipping_product_unique" ON "order_shipping_product" ("order_product_id", "order_shipping_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "FK_66811564f24eb71ac15e5ea124b" FOREIGN KEY ("order_product_id") REFERENCES "order_product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "category_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_category_id" ON "product_category" ("category_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "product_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_category_unique" ON "product_category" ("category_id", "product_id") `,
		);
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "client_id"`);
		await queryRunner.query(
			`ALTER TABLE "order" ADD "client_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_client_id" ON "order" ("client_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "PK_1031171c13130102495201e3e20"`,
		);
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "order" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_ea143999ecfa6a152f2202895e2" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP COLUMN "tag_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD "tag_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_tag_id" ON "product_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD "product_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "PK_1439455c6528caa94fcc8564fda"`,
		);
		await queryRunner.query(`ALTER TABLE "product_tag" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "PK_1439455c6528caa94fcc8564fda" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_tag_unique" ON "product_tag" ("product_id", "tag_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "carrier_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "carrier_id" bigint`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_carrier_id" ON "order_shipping" ("carrier_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "order_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_order_id" ON "order_shipping" ("order_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "PK_9e1174bf865646026aba95d2ae0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "PK_9e1174bf865646026aba95d2ae0" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_b4a21d5bd902c38f79c019fbe99" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping_product" ADD CONSTRAINT "FK_08f57f381c1c316fd7bc0d8b3e6" FOREIGN KEY ("order_shipping_id") REFERENCES "order_shipping"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "attribute_value_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "attribute_value_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "attribute_label_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "attribute_label_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "product_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_product_id" ON "product_attribute" ("product_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_attribute_unique" ON "product_attribute" ("attribute_label_id", "attribute_value_id", "product_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" DROP COLUMN "invoice_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" ADD "invoice_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_payment_invoice_id" ON "payment" ("invoice_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" DROP CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab"`,
		);
		await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "payment" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "payment" ADD CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "product_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "product_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_content_unique_per_lang" ON "product_content" ("language", "product_id") `,
		);
		await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "brand_id"`);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "brand_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_brand_id" ON "product" ("brand_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP CONSTRAINT "PK_bebc9158e480b949565b4dc7a82"`,
		);
		await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD CONSTRAINT "FK_2eb5ce4324613b4b457c364f4a2" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_f768662205b901ba35c9c9255a0" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_400f1584bf37c21172da3b15e2d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_d08cb260c60a9bf0a5e0424768d" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_0374879a971928bc3f57eed0a59" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c8f119684d209b55cf5e8b42532" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "subscription"."user_id" IS 'When subscription is assigned to a user (virtual services)'`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD "user_id" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP COLUMN "order_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD "order_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_subscription_order_id" ON "subscription" ("order_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d"`,
		);
		await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_32ddbd23837b1229248a5cc232b" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "term" DROP CONSTRAINT "PK_55b0479f0743f2e5d5ec414821e"`,
		);
		await queryRunner.query(`ALTER TABLE "term" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "term" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "term" ADD CONSTRAINT "PK_55b0479f0743f2e5d5ec414821e" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_tag" ADD CONSTRAINT "FK_cdc3f155737b763c298ab080f84" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_7bf0b673c19b33c9456d54b2b37" FOREIGN KEY ("tag_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_e9d73f2bb641f92f8d48b13ee7d" FOREIGN KEY ("attribute_value_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c7b5ed8e690ecc7758ecd515844" FOREIGN KEY ("attribute_label_id") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD "user_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_token_user_id" ON "system"."account_token" ("user_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "PK_a55842d3341d42534e39f85e931"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "PK_a55842d3341d42534e39f85e931" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD "user_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_recovery_user_id" ON "system"."account_recovery" ("user_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "PK_d4901111d598239fd13e230f618"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "PK_d4901111d598239fd13e230f618" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "template_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "template_id" bigint`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_template_id" ON "system"."mail_queue" ("template_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP CONSTRAINT "PK_fc59283e1a31da3ce216089305b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD CONSTRAINT "PK_fc59283e1a31da3ce216089305b" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" DROP CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" ADD CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD CONSTRAINT "FK_3871a34c42cb0ceaf17ee65bd6d" FOREIGN KEY ("template_id") REFERENCES "system"."template"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "carrier" DROP CONSTRAINT "PK_f615ebd1906f0270d41b3a5a8b0"`,
		);
		await queryRunner.query(`ALTER TABLE "carrier" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "carrier" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "carrier" ADD CONSTRAINT "PK_f615ebd1906f0270d41b3a5a8b0" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_888c5cf82dd082363ab0b8c1987" FOREIGN KEY ("carrier_id") REFERENCES "carrier"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "category_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "category_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "PK_266faccfe1a64cd9a8e5479deed"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "PK_266faccfe1a64cd9a8e5479deed" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_city"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_city" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_region"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_region" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP COLUMN "address_country"`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "address_country" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" DROP CONSTRAINT "PK_96da49381769303a6515a8785c7"`,
		);
		await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "client" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "FK_a0d9cbb7f4a017bac3198dd8ca0" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP COLUMN "parent_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD "parent_id" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03"`,
		);
		await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "category" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "FK_6a22002acac4976977b1efd114a" FOREIGN KEY ("id_descendant") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_closure" ADD CONSTRAINT "FK_4aa1348fc4b7da9bef0fae8ff48" FOREIGN KEY ("id_ancestor") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_category" ADD CONSTRAINT "FK_20b9ebf3cb2834a02fd65fa0950" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_2df1f83329c00e6eadde0493e16" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_c9c9c3b03be3b5d980ec8cee4ee" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD CONSTRAINT "FK_1117b4fcb3cd4abb4383e1c2743" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" DROP CONSTRAINT "PK_d05d8712e429673e459e7f1cddb"`,
		);
		await queryRunner.query(`ALTER TABLE "discount" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "discount" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "discount" ADD CONSTRAINT "PK_d05d8712e429673e459e7f1cddb" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" DROP CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."permission" ADD CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "permission_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "permission_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "user_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "PK_a7326749e773c740a7104634a77"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "PK_a7326749e773c740a7104634a77" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_user_permission_permission" ON "user_permission" ("permission_id", "user_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_8a4d5521c1ced158c13438df3df" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760"`,
		);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_ab3c66669facfe429164e60ab82" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_604c2b655029e47091f671ba875" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP COLUMN "auth_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD "auth_id" bigint`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_auth_id" ON "logs"."log_history" ("auth_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP COLUMN "entity_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD "entity_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP CONSTRAINT "PK_837ee3d001208e2b7400e7a0487"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD CONSTRAINT "PK_837ee3d001208e2b7400e7a0487" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_entity_id_action" ON "logs"."log_history" ("action", "entity", "entity_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4" FOREIGN KEY ("auth_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP COLUMN "place_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD "place_id" bigint NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "PK_5af1716076889988270c39bd6ff"`,
		);
		await queryRunner.query(`ALTER TABLE "place_content" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "PK_5af1716076889988270c39bd6ff" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_place_content_unique_per_lang" ON "place_content" ("language", "place_id") `,
		);
		await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "parent_id"`);
		await queryRunner.query(`ALTER TABLE "place" ADD "parent_id" bigint`);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_parent_id" ON "place" ("parent_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca"`,
		);
		await queryRunner.query(`ALTER TABLE "place" DROP COLUMN "id"`);
		await queryRunner.query(
			`ALTER TABLE "place" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_da8137d639bcd3bb5a1cac23506" FOREIGN KEY ("address_region") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_7f4ede2827df34706cfdba7238b" FOREIGN KEY ("address_country") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60" FOREIGN KEY ("address_city") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c" FOREIGN KEY ("parent_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" DROP CONSTRAINT "PK_ee6ddd7720fe93171a6b62e4be6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" DROP COLUMN "id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" ADD "id" BIGSERIAL NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_data" ADD CONSTRAINT "PK_ee6ddd7720fe93171a6b62e4be6" PRIMARY KEY ("id")`,
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
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" bigint NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "meta" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content_blocks" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "content" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "brief" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "title" text NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "author" jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "slug" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "language" character varying(3) NOT NULL DEFAULT 'en'`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "deleted_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "updated_at" TIMESTAMP DEFAULT now()`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription_evidence" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_evidence_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_evidence_invoice_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_evidence_subscription_id"`,
		);
		await queryRunner.query(`DROP TABLE "subscription_evidence"`);
		await queryRunner.query(
			`COMMENT ON TABLE "article_content" IS 'Track article views, etc.'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("language", "slug") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_content_unique" ON "category_content" ("category_id", "language") `,
		);
	}
}
