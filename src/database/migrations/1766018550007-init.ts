import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1766018550007 implements MigrationInterface {
	name = 'Init1766018550007';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "logs"."log_data" ("id" BIGSERIAL NOT NULL, "pid" character(36) NOT NULL, "category" character varying NOT NULL, "level" "logs"."log_data_level_enum" NOT NULL, "message" text NOT NULL, "context" text, "debugStack" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee6ddd7720fe93171a6b62e4be6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_data_pid" ON "logs"."log_data" ("pid") `,
		);
		await queryRunner.query(
			`CREATE INDEX "idx_log_data" ON "logs"."log_data" ("created_at", "level", "category") `,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."account_recovery" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "ident" character(36) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" json, "used_at" TIMESTAMP, "expire_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_a298b664b11e30efbcbdf35aa06" UNIQUE ("ident"), CONSTRAINT "PK_d4901111d598239fd13e230f618" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_recovery"."metadata" IS 'Fingerprinting data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_recovery_user_id" ON "system"."account_recovery" ("user_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_recovery_ident" ON "system"."account_recovery" ("ident") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_recovery" IS 'Stores \`ident\` for account password recovery requests'`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."account_token" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "ident" character(36) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" json, "used_at" TIMESTAMP, "expire_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_b75a07f32c73a249ab14d7f052f" UNIQUE ("ident"), CONSTRAINT "PK_a55842d3341d42534e39f85e931" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_token"."metadata" IS 'Fingerprinting data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_account_token_user_id" ON "system"."account_token" ("user_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_account_token_ident" ON "system"."account_token" ("ident") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_token" IS 'Stores \`ident\` for account tokens to manage token revocation'`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."permission" ("id" BIGSERIAL NOT NULL, "entity" character varying NOT NULL, "operation" character varying NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_permission" ON "system"."permission" ("entity", "operation") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."permission" IS 'Stores permissions'`,
		);
		await queryRunner.query(
			`CREATE TABLE "user_permission" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "permission_id" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_a7326749e773c740a7104634a77" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_user_permission_permission" ON "user_permission" ("user_id", "permission_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "user_permission" IS 'Stores user permissions'`,
		);
		await queryRunner.query(
			`CREATE TABLE "user" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "email" character varying NOT NULL, "email_verified_at" TIMESTAMP, "password" character varying NOT NULL, "password_updated_at" TIMESTAMP NOT NULL, "language" character varying(3) NOT NULL, "status" "public"."user_status_enum" NOT NULL DEFAULT 'pending', "role" "public"."user_role_enum" NOT NULL DEFAULT 'member', "operator_type" "public"."user_operator_type_enum", CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")); COMMENT ON COLUMN "user"."operator_type" IS 'Operator type; only relevant when role is OPERATOR'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_user_email" ON "user" ("email") `,
		);
		await queryRunner.query(
			`CREATE TABLE "logs"."log_history" ("id" BIGSERIAL NOT NULL, "entity" character varying NOT NULL, "entity_id" bigint NOT NULL, "action" character varying NOT NULL, "auth_id" bigint, "performed_by" character varying NOT NULL, "request_id" character varying NOT NULL, "source" character varying NOT NULL, "recorded_at" TIMESTAMP NOT NULL, "details" jsonb, CONSTRAINT "PK_837ee3d001208e2b7400e7a0487" PRIMARY KEY ("id")); COMMENT ON COLUMN "logs"."log_history"."details" IS 'Log data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_auth_id" ON "logs"."log_history" ("auth_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_performed_by" ON "logs"."log_history" ("performed_by") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_request_id" ON "logs"."log_history" ("request_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_source" ON "logs"."log_history" ("source") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_recorded_at" ON "logs"."log_history" ("recorded_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_log_history_entity_id_action" ON "logs"."log_history" ("entity_id", "entity", "action") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."log_history" IS 'Store entities history: created, updated, deleted, etc.'`,
		);
		await queryRunner.query(
			`CREATE TABLE "place_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "place_id" bigint NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "name" character varying NOT NULL, "type_label" character varying NOT NULL, "details" jsonb, CONSTRAINT "PK_5af1716076889988270c39bd6ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "place_content"."type_label" IS 'ex: Country, Region, City, Oras, Judet'; COMMENT ON COLUMN "place_content"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_place_content_unique_per_lang" ON "place_content" ("place_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "place_content" IS 'Language-specific content for places'`,
		);
		await queryRunner.query(
			`CREATE TABLE "place" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."place_type_enum" NOT NULL DEFAULT 'country', "parent_id" bigint, "code" character varying(3), CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id")); COMMENT ON COLUMN "place"."code" IS 'Abbreviation'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_parent_id" ON "place" ("parent_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_place_code" ON "place" ("code") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "place" IS 'Places (countries, regions, cities)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."template" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "label" character varying NOT NULL, "language" character varying(3) NOT NULL, "type" "system"."template_type_enum" NOT NULL DEFAULT 'page', "content" jsonb NOT NULL, CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."template"."content" IS 'Template data'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_label_language_type" ON "system"."template" ("label", "language", "type") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."template" IS 'Stores email & page templates'`,
		);
		await queryRunner.query(
			`CREATE TABLE "discount" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "label" character varying NOT NULL, "scope" "public"."discount_scope_enum" NOT NULL, "reason" "public"."discount_reason_enum" NOT NULL, "reference" character varying, "type" "public"."discount_type_enum" NOT NULL, "rules" jsonb, "value" numeric(12,2) NOT NULL, "start_at" TIMESTAMP, "end_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_d05d8712e429673e459e7f1cddb" PRIMARY KEY ("id")); COMMENT ON COLUMN "discount"."label" IS 'Discount name'; COMMENT ON COLUMN "discount"."reference" IS 'Coupon code, referral code, etc'; COMMENT ON COLUMN "discount"."rules" IS 'Optional rules or conditions for discount applicability'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_scope" ON "discount" ("scope") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_reason" ON "discount" ("reason") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_reference" ON "discount" ("reference") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_discount_active" ON "discount" ("start_at", "end_at", "scope") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "discount" IS 'Stores discount definitions. Note: Discount applied only for prices without VAT before exchange rate conversion'`,
		);
		await queryRunner.query(
			`CREATE TABLE "system"."mail_queue" ("id" BIGSERIAL NOT NULL, "template_id" bigint, "language" character(2) NOT NULL, "content" jsonb NOT NULL, "to" jsonb NOT NULL, "from" jsonb, "status" "system"."mail_queue_status_enum" NOT NULL DEFAULT 'pending', "error" text, "sent_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_fc59283e1a31da3ce216089305b" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."mail_queue"."content" IS 'Email content: subject, text, html, vars, layout'; COMMENT ON COLUMN "system"."mail_queue"."to" IS 'To: name & address'; COMMENT ON COLUMN "system"."mail_queue"."from" IS 'From: name & address'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_template_id" ON "system"."mail_queue" ("template_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_status" ON "system"."mail_queue" ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_mail_queue_sent_at" ON "system"."mail_queue" ("sent_at") `,
		);
		await queryRunner.query(
			`CREATE TABLE "invoice" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "ref_code" character varying(3) NOT NULL, "ref_number" integer NOT NULL, "status" "public"."invoice_status_enum" NOT NULL DEFAULT 'draft', "type" "public"."invoice_type_enum" NOT NULL DEFAULT 'charge', "base_currency" character(3) NOT NULL DEFAULT 'RON', "discount" jsonb, "issued_at" TIMESTAMP NOT NULL, "due_at" TIMESTAMP, "paid_at" TIMESTAMP, "billing_details" jsonb, "details" jsonb, "notes" text, CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id")); COMMENT ON COLUMN "invoice"."ref_code" IS 'Invoice series/code, e.g., ABC'; COMMENT ON COLUMN "invoice"."ref_number" IS 'Sequential invoice number within the series'; COMMENT ON COLUMN "invoice"."base_currency" IS 'Base currency for the invoice'; COMMENT ON COLUMN "invoice"."discount" IS 'Array of discount snapshots applied to this order'; COMMENT ON COLUMN "invoice"."billing_details" IS 'Snapshot of billing info at the moment of issuing the invoice'; COMMENT ON COLUMN "invoice"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_order_id" ON "invoice" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_status" ON "invoice" ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_invoice_type" ON "invoice" ("type") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_invoice_ref" ON "invoice" ("ref_number", "ref_code") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "invoice" IS 'Stores invoices generated from orders'`,
		);
		await queryRunner.query(
			`CREATE TABLE "brand" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "slug" character varying NOT NULL, "status" "public"."brand_status_enum" NOT NULL DEFAULT 'active', "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id")); COMMENT ON COLUMN "brand"."sort_order" IS 'Order/position of the brand in a listing'; COMMENT ON COLUMN "brand"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_brand_slug" ON "brand" ("slug") `,
		);
		await queryRunner.query(
			`CREATE TABLE "term" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."term_type_enum" NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "value" character varying(255) NOT NULL, "details" jsonb, CONSTRAINT "PK_55b0479f0743f2e5d5ec414821e" PRIMARY KEY ("id")); COMMENT ON COLUMN "term"."language" IS 'ISO language code (en will the fallback for universal terms)'; COMMENT ON COLUMN "term"."value" IS 'Localized or universal term value'; COMMENT ON COLUMN "term"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_term_type" ON "term" ("type") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "term" IS 'Multilingual taxonomy terms: categories, tags, attribute labels/values'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_attribute" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "attribute_label_id" bigint NOT NULL, "attribute_value_id" bigint NOT NULL, CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_attribute_product_id" ON "product_attribute" ("product_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_attribute_unique" ON "product_attribute" ("product_id", "attribute_label_id", "attribute_value_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_attribute" IS 'Key/value attributes for products, using multilingual terms'`,
		);
		await queryRunner.query(
			`CREATE TABLE "category_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "category_id" bigint NOT NULL, "language" character varying(2) NOT NULL DEFAULT 'en', "label_id" bigint NOT NULL, "slug_id" bigint NOT NULL, "description_id" bigint, "meta" jsonb, "details" jsonb, CONSTRAINT "PK_266faccfe1a64cd9a8e5479deed" PRIMARY KEY ("id")); COMMENT ON COLUMN "category_content"."language" IS 'Using explicit column avoids overloading \`term\` for language lookups.'; COMMENT ON COLUMN "category_content"."meta" IS 'SEO metadata, canonical URL, images, structured data, etc.'; COMMENT ON COLUMN "category_content"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_category_content_slug_id" ON "category_content" ("slug_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_content_unique" ON "category_content" ("category_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "category_content" IS 'Language-specific category content (slug, description, metadata)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "category" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."category_status_enum" NOT NULL DEFAULT 'pending', "type" "public"."category_type_enum" NOT NULL DEFAULT 'product', "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, "parentId" bigint, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")); COMMENT ON COLUMN "category"."type" IS 'Specifies the entity type this category belongs to'; COMMENT ON COLUMN "category"."sort_order" IS 'Sort order among siblings'; COMMENT ON COLUMN "category"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_category_type" ON "category" ("type", "status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "category" IS 'Hierarchical product categories'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_category" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "category_id" bigint NOT NULL, "details" jsonb, CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_category"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_category_category_id" ON "product_category" ("category_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_category_unique" ON "product_category" ("product_id", "category_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_category" IS 'Links products to categories (multilingual via term)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_tag" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "tag_id" bigint NOT NULL, "details" jsonb, CONSTRAINT "PK_1439455c6528caa94fcc8564fda" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_tag"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_tag_tag_id" ON "product_tag" ("tag_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_tag_unique" ON "product_tag" ("product_id", "tag_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_tag" IS 'Links products to tag terms'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "sku" character varying NOT NULL, "brand_id" bigint NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "vat_rate" numeric(5,2) NOT NULL DEFAULT '0', "workflow" "public"."product_workflow_enum" NOT NULL DEFAULT 'draft', "sale_status" "public"."product_sale_status_enum" NOT NULL DEFAULT 'on_sale', "type" "public"."product_type_enum" NOT NULL DEFAULT 'physical', "stock_status" "public"."product_stock_status_enum", "stock_qty" integer NOT NULL DEFAULT '0', "stock_updated_at" TIMESTAMP NOT NULL, "details" jsonb, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")); COMMENT ON COLUMN "product"."price" IS 'Default price if not specified otherwise'; COMMENT ON COLUMN "product"."currency" IS 'Default currency for price if not specified otherwise'; COMMENT ON COLUMN "product"."vat_rate" IS 'Default VAT rate if not specified otherwise'; COMMENT ON COLUMN "product"."stock_status" IS 'Stock status; updated via cron job'; COMMENT ON COLUMN "product"."stock_qty" IS 'Available stock quantity - this is just a snapshot not the real value'; COMMENT ON COLUMN "product"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_sku" ON "product" ("sku") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_brand_id" ON "product" ("brand_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_workflow" ON "product" ("workflow") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_sale_status" ON "product" ("sale_status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product" IS 'Stores core product information; textual content is saved in a product-content.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_product" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "product_id" bigint NOT NULL, "quantity" numeric(12,2) NOT NULL, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" jsonb, "notes" text, CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_product"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_product"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_product"."discount" IS 'Array of discount snapshots applied to this product line'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_order_id" ON "order_product" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_product_product_id" ON "order_product" ("product_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_product" IS 'Stores ordered products (order line items)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "carrier" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "website" character varying, "phone" character varying, "email" character varying, "notes" text, CONSTRAINT "UQ_1a6ace8d7d38ec60c03c0c83977" UNIQUE ("name"), CONSTRAINT "PK_f615ebd1906f0270d41b3a5a8b0" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_carrier_name" ON "carrier" ("name") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "carrier" IS 'Stores shipping carriers'`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_shipping" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "status" "public"."order_shipping_status_enum" NOT NULL DEFAULT 'pending', "method" character varying, "carrier_id" bigint, "tracking_number" character varying, "tracking_url" character varying, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" text, "contact_name" character varying, "contact_phone" character varying, "contact_email" character varying, "address_country" character varying, "address_region" character varying, "address_city" character varying, "address_info" character varying, "address_postal_code" character varying, "shipped_at" TIMESTAMP, "delivered_at" TIMESTAMP, "estimated_delivery_at" TIMESTAMP, "notes" text, CONSTRAINT "PK_9e1174bf865646026aba95d2ae0" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_shipping"."method" IS 'eg: courier, pickup, same-day, own-fleet, etc'; COMMENT ON COLUMN "order_shipping"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_shipping"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_shipping"."discount" IS 'Array of discount snapshots applied to this order'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_order_id" ON "order_shipping" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_status" ON "order_shipping" ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_method" ON "order_shipping" ("method") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_shipping_carrier_id" ON "order_shipping" ("carrier_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_shipping_tracking_number" ON "order_shipping" ("tracking_number") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_shipping" IS 'Stores shipping details for orders'`,
		);
		await queryRunner.query(
			`CREATE TABLE "order" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_id" bigint NOT NULL, "ref_number" character varying NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'draft', "type" "public"."order_type_enum" NOT NULL DEFAULT 'standard', "issued_at" TIMESTAMP NOT NULL, "notes" text, CONSTRAINT "UQ_b8f1c6f7050e71f1ddb5b40684f" UNIQUE ("ref_number"), CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_client_id" ON "order" ("client_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_ref_number" ON "order" ("ref_number") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_status" ON "order" ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_issued_at" ON "order" ("issued_at") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order" IS 'Stores order information'`,
		);
		await queryRunner.query(
			`CREATE TABLE "client" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_type" "public"."client_client_type_enum" NOT NULL, "status" "public"."client_status_enum" NOT NULL DEFAULT 'pending', "company_name" character varying, "company_cui" character varying, "company_reg_com" character varying, "person_name" character varying, "person_cnp" character varying, "iban" character varying, "bank_name" character varying, "contact_name" character varying, "contact_email" character varying, "contact_phone" character varying, "address_country" bigint, "address_region" bigint, "address_city" bigint, "address_info" text, "address_postal_code" character varying, "notes" text, CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_cnp_unique" ON "client" ("person_cnp") WHERE person_cnp IS NOT NULL AND client_type = 'person'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_reg_com_unique" ON "client" ("company_reg_com") WHERE company_reg_com IS NOT NULL AND client_type = 'company'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_cui_unique" ON "client" ("company_cui") WHERE company_cui IS NOT NULL AND client_type = 'company'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_client_company_name_unique" ON "client" ("company_name") WHERE company_name IS NOT NULL AND client_type = 'company'`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "client" IS 'Stores client information for persons OR companies'`,
		);
		await queryRunner.query(
			`CREATE TABLE "subscription" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "user_id" bigint, "ref_code" integer NOT NULL, "status" "public"."subscription_status_enum" NOT NULL DEFAULT 'active', "start_at" TIMESTAMP, "end_at" TIMESTAMP, "grace_period" smallint NOT NULL DEFAULT '0', "auto_renew" boolean NOT NULL DEFAULT true, "retry_count" smallint NOT NULL, "retry_interval" smallint NOT NULL, "next_billing_at" TIMESTAMP, "notes" text, "details" jsonb, CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscription"."user_id" IS 'When subscription is assigned to a user (virtual services)'; COMMENT ON COLUMN "subscription"."ref_code" IS 'Subscription reference code (e.g., S12345)'; COMMENT ON COLUMN "subscription"."start_at" IS 'When the subscription started'; COMMENT ON COLUMN "subscription"."end_at" IS 'When the subscription ended (if cancelled/expired)'; COMMENT ON COLUMN "subscription"."grace_period" IS 'Number of days offered past end at as a grace period to allow renewals'; COMMENT ON COLUMN "subscription"."auto_renew" IS 'Whether the subscription renews automatically'; COMMENT ON COLUMN "subscription"."retry_count" IS 'Max count of renewals attempts before the subscription is marked as expired'; COMMENT ON COLUMN "subscription"."retry_interval" IS 'Number of days between each renewal attempt'; COMMENT ON COLUMN "subscription"."next_billing_at" IS 'Next scheduled billing date'; COMMENT ON COLUMN "subscription"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_subscription_order_id" ON "subscription" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_subscription_ref_code" ON "subscription" ("ref_code") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_status" ON "subscription" ("status") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_subscription_end_at" ON "subscription" ("end_at", "status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription" IS 'Recurring subscriptions created from orders'`,
		);
		await queryRunner.query(
			`CREATE TABLE "subscription_renewal" ("id" BIGSERIAL NOT NULL, "subscription_id" bigint NOT NULL, "invoice_id" bigint NOT NULL, "status" "public"."subscription_renewal_status_enum" NOT NULL, "response_data" jsonb, "fail_reason" text, "recorded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7387757b68bb7b734997f64a04a" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscription_renewal"."response_data" IS 'Response data from the payment gateway. For example: { "transaction_id": "1234567890" }'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_renewals_subscription_id" ON "subscription_renewal" ("subscription_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_renewals_invoice_id" ON "subscription_renewal" ("invoice_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_subscription_renewals_status" ON "subscription_renewal" ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription_renewal" IS 'Used to track renewal attempts for subscriptions.'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "label" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "meta" jsonb, CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_content"."meta" IS 'SEO metadata for product pages.'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_content_slug_lang" ON "product_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_content_unique_per_lang" ON "product_content" ("product_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_content" IS 'Language-specific content for products (name, slug, descriptions, meta)'`,
		);
		await queryRunner.query(
			`CREATE TABLE "payment" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "invoice_id" bigint NOT NULL, "gateway" "public"."payment_gateway_enum" NOT NULL, "status" "public"."payment_status_enum" NOT NULL DEFAULT 'pending', "amount" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "transaction_id" character varying, "gateway_response" jsonb, "fail_reason" text, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id")); COMMENT ON COLUMN "payment"."amount" IS 'Amount intended to be charged'; COMMENT ON COLUMN "payment"."transaction_id" IS 'Gateway transaction ID (e.g., Stripe charge id)'; COMMENT ON COLUMN "payment"."gateway_response" IS 'Full gateway response snapshot for debugging/audit'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_payment_invoice_id" ON "payment" ("invoice_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_payment_status" ON "payment" ("status") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_payment_transaction_id" ON "payment" ("transaction_id") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "payment" IS 'Tracks payments from various gateways and links them to invoices.'`,
		);
		await queryRunner.query(
			`CREATE TABLE "logs"."cron_history" ("id" BIGSERIAL NOT NULL, "label" character varying NOT NULL, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "status" "logs"."cron_history_status_enum" NOT NULL, "run_time" smallint NOT NULL DEFAULT '0', "content" jsonb, CONSTRAINT "PK_459b846bf883b0de2833b411c19" PRIMARY KEY ("id")); COMMENT ON COLUMN "logs"."cron_history"."run_time" IS 'Run time in seconds'; COMMENT ON COLUMN "logs"."cron_history"."content" IS 'Cron data'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cron_history_start_at" ON "logs"."cron_history" ("start_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cron_history_status" ON "logs"."cron_history" ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."cron_history" IS 'Stores cron usage'`,
		);
		await queryRunner.query(
			`CREATE TABLE "image" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "entity_type" text NOT NULL, "entity_id" bigint NOT NULL, "kind" text NOT NULL, "is_main" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "details" jsonb, CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id")); COMMENT ON COLUMN "image"."entity_type" IS 'The type of entity this image belongs to (product, category, brand, etc.)'; COMMENT ON COLUMN "image"."entity_id" IS 'ID of the entity this image is linked to'; COMMENT ON COLUMN "image"."kind" IS 'The kind of the image (eg: primary, logo, gallery, etc)'; COMMENT ON COLUMN "image"."sort_order" IS 'Order/position of the image within the entity type'; COMMENT ON COLUMN "image"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_image_unique_main" ON "image" ("is_main") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_type_id" ON "image" ("entity_type", "entity_id", "kind") `,
		);
		await queryRunner.query(
			`CREATE TABLE "image_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "image_id" bigint NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "fileProps" jsonb NOT NULL, "elementAttrs" jsonb, CONSTRAINT "PK_7f5b75103fb93c4bc1c1fd46496" PRIMARY KEY ("id")); COMMENT ON COLUMN "image_content"."fileProps" IS 'Properties of the image file'; COMMENT ON COLUMN "image_content"."elementAttrs" IS 'HTML element attributes (alt, title, etc.)'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_image_content_unique_per_lang" ON "image_content" ("image_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "image_content" IS 'Language-specific content for images'`,
		);
		await queryRunner.query(
			`CREATE TABLE "brand_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "brand_id" bigint NOT NULL, "language" character varying(3) NOT NULL DEFAULT 'en', "description" text, "meta" jsonb, CONSTRAINT "PK_8e9d5488729b396e59d9144ea27" PRIMARY KEY ("id")); COMMENT ON COLUMN "brand_content"."language" IS 'Using explicit column avoids overloading \`term\` for language lookups.'; COMMENT ON COLUMN "brand_content"."meta" IS 'SEO metadata for brand pages.'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_brand_content_unique_per_lang" ON "brand_content" ("brand_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "brand_content" IS 'Language-specific content for brands (descriptions, meta)'`,
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
			`CREATE TABLE "article" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "status" "public"."article_status_enum" NOT NULL DEFAULT 'draft', "layout" text NOT NULL, "details" jsonb, "publish_at" TIMESTAMP, "show_start_at" TIMESTAMP, "show_end_at" TIMESTAMP, "featuredStatus" "public"."article_featuredstatus_enum" NOT NULL DEFAULT 'nowhere', CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")); COMMENT ON COLUMN "article"."details" IS 'Reserved column for future use'; COMMENT ON COLUMN "article"."show_start_at" IS 'Controls when the article should be displayed'; COMMENT ON COLUMN "article"."show_end_at" IS 'Controls when the article should be displayed'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_status" ON "article" ("status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "article" IS 'Stores core article information; textual content is saved in article-content.entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "category_closure" ("id_ancestor" bigint NOT NULL, "id_descendant" bigint NOT NULL, CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY ("id_ancestor", "id_descendant"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4aa1348fc4b7da9bef0fae8ff4" ON "category_closure" ("id_ancestor") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_6a22002acac4976977b1efd114" ON "category_closure" ("id_descendant") `,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "views"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP COLUMN "reading_time_minutes"`,
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
			`ALTER TABLE "article_content" ADD "language" character varying(3) NOT NULL DEFAULT 'en'`,
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
			`ALTER TABLE "article_content" DROP CONSTRAINT "REL_695e2a3fb3e8f1995d703d5b91"`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_604c2b655029e47091f671ba875" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_ab3c66669facfe429164e60ab82" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_8a4d5521c1ced158c13438df3df" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" ADD CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4" FOREIGN KEY ("auth_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" ADD CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" ADD CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c" FOREIGN KEY ("parent_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
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
			`ALTER TABLE "category" ADD CONSTRAINT "FK_d5456fd7e4c4866fec8ada1fa10" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
			`ALTER TABLE "client" ADD CONSTRAINT "FK_7f4ede2827df34706cfdba7238b" FOREIGN KEY ("address_country") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_da8137d639bcd3bb5a1cac23506" FOREIGN KEY ("address_region") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "client" ADD CONSTRAINT "FK_62d41b573e8a6d5e4a8edddac60" FOREIGN KEY ("address_city") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_32ddbd23837b1229248a5cc232b" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_renewal" ADD CONSTRAINT "FK_a65456c4f3efacae2da403632a2" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_f768662205b901ba35c9c9255a0" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" ADD CONSTRAINT "FK_c1718000e7e049b9841f8b4b222" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "brand_content" ADD CONSTRAINT "FK_6699af3eb85f6ba17010c71167f" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
			`ALTER TABLE "brand_content" DROP CONSTRAINT "FK_6699af3eb85f6ba17010c71167f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "image_content" DROP CONSTRAINT "FK_c1718000e7e049b9841f8b4b222"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_f768662205b901ba35c9c9255a0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_renewal" DROP CONSTRAINT "FK_a65456c4f3efacae2da403632a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_940d49a105d50bbd616be540013"`,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription" DROP CONSTRAINT "FK_32ddbd23837b1229248a5cc232b"`,
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
			`ALTER TABLE "category" DROP CONSTRAINT "FK_d5456fd7e4c4866fec8ada1fa10"`,
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
			`ALTER TABLE "invoice" DROP CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place" DROP CONSTRAINT "FK_e8f42244c2d9143a42b13bd1d0c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "place_content" DROP CONSTRAINT "FK_9f8efc4eaa0dadccb2a8f4794b1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."log_history" DROP CONSTRAINT "FK_4daa26d01591f9e64dd97670ea4"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_8a4d5521c1ced158c13438df3df"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_ab3c66669facfe429164e60ab82"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_604c2b655029e47091f671ba875"`,
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
			`ALTER TABLE "article_content" ADD "reading_time_minutes" integer`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD "views" bigint NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_6a22002acac4976977b1efd114"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_4aa1348fc4b7da9bef0fae8ff4"`,
		);
		await queryRunner.query(`DROP TABLE "category_closure"`);
		await queryRunner.query(`COMMENT ON TABLE "article" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_article_status"`);
		await queryRunner.query(`DROP TABLE "article"`);
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
		await queryRunner.query(`COMMENT ON TABLE "brand_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_brand_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "brand_content"`);
		await queryRunner.query(`COMMENT ON TABLE "image_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_image_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "image_content"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_type_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_image_unique_main"`);
		await queryRunner.query(`DROP TABLE "image"`);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."cron_history" IS NULL`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_cron_history_status"`);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_cron_history_start_at"`,
		);
		await queryRunner.query(`DROP TABLE "logs"."cron_history"`);
		await queryRunner.query(`COMMENT ON TABLE "payment" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_payment_transaction_id"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_payment_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_payment_invoice_id"`);
		await queryRunner.query(`DROP TABLE "payment"`);
		await queryRunner.query(`COMMENT ON TABLE "product_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_slug_lang"`,
		);
		await queryRunner.query(`DROP TABLE "product_content"`);
		await queryRunner.query(
			`COMMENT ON TABLE "subscription_renewal" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_renewals_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_renewals_invoice_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_renewals_subscription_id"`,
		);
		await queryRunner.query(`DROP TABLE "subscription_renewal"`);
		await queryRunner.query(`COMMENT ON TABLE "subscription" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_end_at"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_ref_code"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_subscription_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "subscription"`);
		await queryRunner.query(`COMMENT ON TABLE "client" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_client_company_name_unique"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_client_cui_unique"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_client_reg_com_unique"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_client_cnp_unique"`);
		await queryRunner.query(`DROP TABLE "client"`);
		await queryRunner.query(`COMMENT ON TABLE "order" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_issued_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_ref_number"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_id"`);
		await queryRunner.query(`DROP TABLE "order"`);
		await queryRunner.query(`COMMENT ON TABLE "order_shipping" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_tracking_number"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_carrier_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_method"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_shipping_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "order_shipping"`);
		await queryRunner.query(`COMMENT ON TABLE "carrier" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_carrier_name"`);
		await queryRunner.query(`DROP TABLE "carrier"`);
		await queryRunner.query(`COMMENT ON TABLE "order_product" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_product_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_product_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "order_product"`);
		await queryRunner.query(`COMMENT ON TABLE "product" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_sale_status"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_workflow"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_brand_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_sku"`);
		await queryRunner.query(`DROP TABLE "product"`);
		await queryRunner.query(`COMMENT ON TABLE "product_tag" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_unique"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_tag_tag_id"`);
		await queryRunner.query(`DROP TABLE "product_tag"`);
		await queryRunner.query(`COMMENT ON TABLE "product_category" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_category_category_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_category"`);
		await queryRunner.query(`COMMENT ON TABLE "category" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_category_type"`);
		await queryRunner.query(`DROP TABLE "category"`);
		await queryRunner.query(`COMMENT ON TABLE "category_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_category_content_slug_id"`,
		);
		await queryRunner.query(`DROP TABLE "category_content"`);
		await queryRunner.query(`COMMENT ON TABLE "product_attribute" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_unique"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_attribute_product_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_attribute"`);
		await queryRunner.query(`COMMENT ON TABLE "term" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_term_type"`);
		await queryRunner.query(`DROP TABLE "term"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_brand_slug"`);
		await queryRunner.query(`DROP TABLE "brand"`);
		await queryRunner.query(`COMMENT ON TABLE "invoice" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_ref"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_type"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_order_id"`);
		await queryRunner.query(`DROP TABLE "invoice"`);
		await queryRunner.query(`DROP INDEX "system"."IDX_mail_queue_sent_at"`);
		await queryRunner.query(`DROP INDEX "system"."IDX_mail_queue_status"`);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_mail_queue_template_id"`,
		);
		await queryRunner.query(`DROP TABLE "system"."mail_queue"`);
		await queryRunner.query(`COMMENT ON TABLE "discount" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_active"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_reference"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_reason"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_scope"`);
		await queryRunner.query(`DROP TABLE "discount"`);
		await queryRunner.query(`COMMENT ON TABLE "system"."template" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_label_language_type"`,
		);
		await queryRunner.query(`DROP TABLE "system"."template"`);
		await queryRunner.query(`COMMENT ON TABLE "place" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_code"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_place_parent_id"`);
		await queryRunner.query(`DROP TABLE "place"`);
		await queryRunner.query(`COMMENT ON TABLE "place_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_place_content_unique_per_lang"`,
		);
		await queryRunner.query(`DROP TABLE "place_content"`);
		await queryRunner.query(
			`COMMENT ON TABLE "logs"."log_history" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_entity_id_action"`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_recorded_at"`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_history_source"`);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_request_id"`,
		);
		await queryRunner.query(
			`DROP INDEX "logs"."IDX_log_history_performed_by"`,
		);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_history_auth_id"`);
		await queryRunner.query(`DROP TABLE "logs"."log_history"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`COMMENT ON TABLE "user_permission" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_user_permission_permission"`,
		);
		await queryRunner.query(`DROP TABLE "user_permission"`);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."permission" IS NULL`,
		);
		await queryRunner.query(`DROP INDEX "system"."IDX_permission"`);
		await queryRunner.query(`DROP TABLE "system"."permission"`);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_token" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_token_ident"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_token_user_id"`,
		);
		await queryRunner.query(`DROP TABLE "system"."account_token"`);
		await queryRunner.query(
			`COMMENT ON TABLE "system"."account_recovery" IS NULL`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_recovery_ident"`,
		);
		await queryRunner.query(
			`DROP INDEX "system"."IDX_account_recovery_user_id"`,
		);
		await queryRunner.query(`DROP TABLE "system"."account_recovery"`);
		await queryRunner.query(`DROP INDEX "logs"."idx_log_data"`);
		await queryRunner.query(`DROP INDEX "logs"."IDX_log_data_pid"`);
		await queryRunner.query(`DROP TABLE "logs"."log_data"`);
	}
}
