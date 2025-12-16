import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EntitiesUpdate1765061418600 implements MigrationInterface {
	name = 'EntitiesUpdate1765061418600';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_account_recovery_user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_account_token_user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_user_permission_user_id"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_user_permission_permission_id"`,
		);
		await queryRunner.query(`COMMENT ON TABLE "user" IS NULL`);
		await queryRunner.query(
			`CREATE TYPE "public"."order_invoice_status_enum" AS ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded')`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_invoice" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "invoice_code" character(3) NOT NULL, "invoice_number" integer NOT NULL, "status" "public"."order_invoice_status_enum" NOT NULL DEFAULT 'draft', "base_currency" character(3) NOT NULL DEFAULT 'RON', "discount" jsonb, "issued_at" TIMESTAMP NOT NULL, "due_at" TIMESTAMP, "paid_at" TIMESTAMP, "billing_details" jsonb, "notes" text, "orderId" bigint, CONSTRAINT "PK_93ce10e74111c24405be0726bfd" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_invoice"."invoice_code" IS 'Invoice series/code, e.g., ABC'; COMMENT ON COLUMN "order_invoice"."invoice_number" IS 'Sequential invoice number within the series'; COMMENT ON COLUMN "order_invoice"."base_currency" IS 'Base currency for the invoice'; COMMENT ON COLUMN "order_invoice"."discount" IS 'Array of discount snapshots applied to this order'; COMMENT ON COLUMN "order_invoice"."billing_details" IS 'Snapshot of billing info at the moment of issuing the invoice'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_invoice_order_id" ON "order_invoice" ("order_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_invoice_status" ON "order_invoice" ("status") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_invoice_code_number" ON "order_invoice" ("invoice_code", "invoice_number") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "order_invoice" IS 'Stores invoices generated from orders'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."term_type_enum" AS ENUM('category_label', 'category_slug', 'tag', 'attribute_label', 'attribute_value', 'text')`,
		);
		await queryRunner.query(
			`CREATE TABLE "term" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."term_type_enum" NOT NULL, "language" character(3) NOT NULL DEFAULT 'en', "value" character varying(255) NOT NULL, "details" jsonb, CONSTRAINT "PK_55b0479f0743f2e5d5ec414821e" PRIMARY KEY ("id")); COMMENT ON COLUMN "term"."language" IS 'ISO language code (en will the fallback for universal terms)'; COMMENT ON COLUMN "term"."value" IS 'Localized or universal term value'; COMMENT ON COLUMN "term"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_term_type" ON "term" ("type") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "term" IS 'Multilingual taxonomy terms: categories, tags, attribute labels/values'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_attribute" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "attribute_label_id" bigint NOT NULL, "attribute_value_id" bigint NOT NULL, "productId" bigint, "attributeLabelId" bigint, "attributeValueId" bigint, CONSTRAINT "PK_f9b91f38df3dbbe481d9e056e5e" PRIMARY KEY ("id"))`,
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
			`CREATE TABLE "category_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "category_id" bigint NOT NULL, "language" character(3) NOT NULL DEFAULT 'en', "label_id" bigint NOT NULL, "slug_id" bigint NOT NULL, "description_id" bigint, "meta" jsonb, "details" jsonb, "categoryId" bigint, "labelId" bigint, "slugId" bigint, "descriptionId" bigint, CONSTRAINT "PK_266faccfe1a64cd9a8e5479deed" PRIMARY KEY ("id")); COMMENT ON COLUMN "category_content"."language" IS 'Using explicit column avoids overloading \`term\` for language lookups.'; COMMENT ON COLUMN "category_content"."meta" IS 'SEO metadata, canonical URL, images, structured data, etc.'; COMMENT ON COLUMN "category_content"."details" IS 'Reserved column for future use'`,
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
			`CREATE TYPE "public"."category_status_enum" AS ENUM('active', 'pending', 'inactive')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."category_type_enum" AS ENUM('product', 'article')`,
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
			`CREATE TABLE "product_category" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "category_id" bigint NOT NULL, "details" jsonb, "productId" bigint, "categoryId" bigint, CONSTRAINT "PK_0dce9bc93c2d2c399982d04bef1" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_category"."details" IS 'Reserved column for future use'`,
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
			`CREATE TABLE "product_tag" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "tag_id" bigint NOT NULL, "details" jsonb, "productId" bigint, "tagId" bigint, CONSTRAINT "PK_1439455c6528caa94fcc8564fda" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_tag"."details" IS 'Reserved column for future use'`,
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
			`CREATE TYPE "public"."product_workflow_enum" AS ENUM('draft', 'pending_review', 'revision_required', 'ready')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_sale_status_enum" AS ENUM('on_sale', 'coming_soon', 'seasonal', 'discontinued', 'archived')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_type_enum" AS ENUM('physical', 'digital', 'service')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."product_stock_status_enum" AS ENUM('low_stock', 'out_of_stock')`,
		);
		await queryRunner.query(
			`CREATE TABLE "product" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "sku" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "vat_rate" numeric(5,2) NOT NULL DEFAULT '0', "workflow" "public"."product_workflow_enum" NOT NULL DEFAULT 'draft', "sale_status" "public"."product_sale_status_enum" NOT NULL DEFAULT 'on_sale', "type" "public"."product_type_enum" NOT NULL DEFAULT 'physical', "stock_status" "public"."product_stock_status_enum", "stock_qty" integer NOT NULL DEFAULT '0', "stock_updated_at" TIMESTAMP NOT NULL, "details" jsonb, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")); COMMENT ON COLUMN "product"."price" IS 'Default price if not specified otherwise'; COMMENT ON COLUMN "product"."currency" IS 'Default currency for price if not specified otherwise'; COMMENT ON COLUMN "product"."vat_rate" IS 'Default VAT rate if not specified otherwise'; COMMENT ON COLUMN "product"."stock_status" IS 'Stock status; updated via cron job'; COMMENT ON COLUMN "product"."stock_qty" IS 'Available stock quantity - this is just a snapshot not the real value'; COMMENT ON COLUMN "product"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_sku" ON "product" ("sku") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_workflow" ON "product" ("workflow") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_status" ON "product" ("sale_status") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product" IS 'Stores core product information; textual content is saved in a separate entity'`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_product" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "product_id" bigint NOT NULL, "quantity" numeric(12,2) NOT NULL, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" jsonb, "notes" text, "orderId" bigint, "productId" bigint, CONSTRAINT "PK_539ede39e518562dfdadfddb492" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_product"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_product"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_product"."discount" IS 'Array of discount snapshots applied to this product line'`,
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
			`COMMENT ON TABLE "carrier" IS 'Stores shipping carriers'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."order_shipping_status_enum" AS ENUM('pending', 'preparing', 'shipped', 'delivered', 'failed', 'returned')`,
		);
		await queryRunner.query(
			`CREATE TABLE "order_shipping" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "status" "public"."order_shipping_status_enum" NOT NULL DEFAULT 'pending', "method" character varying, "carrier_id" bigint, "tracking_number" character varying, "tracking_url" character varying, "vat_rate" numeric(5,2) NOT NULL, "price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'RON', "exchange_rate" numeric(10,6) NOT NULL DEFAULT '1', "discount" text, "contact_name" character varying, "contact_phone" character varying, "contact_email" character varying, "address_country" character varying, "address_region" character varying, "address_city" character varying, "address_info" character varying, "address_postal_code" character varying, "shipped_at" TIMESTAMP, "delivered_at" TIMESTAMP, "estimated_delivery_at" TIMESTAMP, "notes" text, "orderId" bigint, "carrierId" bigint, CONSTRAINT "PK_9e1174bf865646026aba95d2ae0" PRIMARY KEY ("id")); COMMENT ON COLUMN "order_shipping"."method" IS 'eg: courier, pickup, same-day, own-fleet, etc'; COMMENT ON COLUMN "order_shipping"."currency" IS 'Currency is specific to client'; COMMENT ON COLUMN "order_shipping"."exchange_rate" IS 'Exchange rate to invoice base currency (default 1 = same currency)'; COMMENT ON COLUMN "order_shipping"."discount" IS 'Array of discount snapshots applied to this order'`,
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
			`CREATE TYPE "public"."order_status_enum" AS ENUM('draft', 'pending', 'confirmed', 'completed', 'cancelled')`,
		);
		await queryRunner.query(
			`CREATE TABLE "order" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_ref" character varying NOT NULL, "client_id" bigint NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'draft', "issued_at" TIMESTAMP NOT NULL, "notes" text, "clientId" bigint, CONSTRAINT "UQ_c12cbb238d09ce1e94dcb11fba7" UNIQUE ("client_ref"), CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_order_client_ref" ON "order" ("client_ref") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_client_id" ON "order" ("client_id") `,
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
			`CREATE TYPE "public"."client_client_type_enum" AS ENUM('person', 'company')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."client_status_enum" AS ENUM('active', 'inactive', 'pending')`,
		);
		await queryRunner.query(
			`CREATE TABLE "client" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "client_type" "public"."client_client_type_enum" NOT NULL, "status" "public"."client_status_enum" NOT NULL DEFAULT 'active', "company_name" character varying, "company_cui" character varying, "company_reg_com" character varying, "person_name" character varying, "person_cnp" character varying, "iban" character varying, "bank_name" character varying, "contact_name" character varying, "contact_email" character varying, "contact_phone" character varying, "address_country" character varying NOT NULL DEFAULT 'Romania', "address_region" character varying, "address_city" character varying, "address_info" character varying, "address_postal_code" character varying, "notes" text, CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_client_cui" ON "client" ("company_cui") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "client" IS 'Stores client information for persons OR companies'`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_content" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "product_id" bigint NOT NULL, "language" character(3) NOT NULL DEFAULT 'en', "label_id" bigint NOT NULL, "slug_id" bigint NOT NULL, "description_id" bigint, "meta" jsonb, "details" jsonb, "productId" bigint, "labelId" bigint, "slugId" bigint, "descriptionId" bigint, CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e" PRIMARY KEY ("id")); COMMENT ON COLUMN "product_content"."language" IS 'Using explicit column avoids overloading \`term\` for language lookups.'; COMMENT ON COLUMN "product_content"."meta" IS 'SEO metadata for product pages.'; COMMENT ON COLUMN "product_content"."details" IS 'Reserved column for future use'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_product_content_slug_id" ON "product_content" ("slug_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_product_content_unique_per_lang" ON "product_content" ("product_id", "language") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "product_content" IS 'Language-specific content for products (name, slug, descriptions, meta)'`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_scope_enum" AS ENUM('client', 'order', 'product', 'category', 'country')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_reason_enum" AS ENUM('flash_sale', 'first_time_customer', 'loyalty_discount', 'birthday_discount', 'referral_discount', 'vip_discount', 'special_discount')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."discount_type_enum" AS ENUM('percent', 'fixed_amount')`,
		);
		await queryRunner.query(
			`CREATE TABLE "discount" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "label" character varying NOT NULL, "scope" "public"."discount_scope_enum" NOT NULL, "reason" "public"."discount_reason_enum" NOT NULL, "reference" character varying, "type" "public"."discount_type_enum" NOT NULL, "rules" jsonb, "value" numeric(12,2) NOT NULL, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "notes" text, CONSTRAINT "PK_d05d8712e429673e459e7f1cddb" PRIMARY KEY ("id")); COMMENT ON COLUMN "discount"."label" IS 'Discount name'; COMMENT ON COLUMN "discount"."reference" IS 'Coupon code, referral code, etc'; COMMENT ON COLUMN "discount"."rules" IS 'Optional rules or conditions for discount applicability'`,
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
			`CREATE TABLE "category_closure" ("id_ancestor" bigint NOT NULL, "id_descendant" bigint NOT NULL, CONSTRAINT "PK_8da8666fc72217687e9b4f4c7e9" PRIMARY KEY ("id_ancestor", "id_descendant"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4aa1348fc4b7da9bef0fae8ff4" ON "category_closure" ("id_ancestor") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_6a22002acac4976977b1efd114" ON "category_closure" ("id_descendant") `,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "userId" bigint`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD "permissionId" bigint`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."user_operator_type_enum" AS ENUM('seller', 'product_manager', 'content_editor')`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "operator_type" "public"."user_operator_type_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "user"."operator_type" IS 'Operator type; only relevant when role is OPERATOR'`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "password_updated_at" DROP DEFAULT`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" ADD "content" jsonb NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."template"."content" IS 'Template data'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "content" jsonb NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."mail_queue"."content" IS 'Email content: subject, text, html, vars, layout'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "to"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "to" jsonb NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."mail_queue"."to" IS 'To: name & address'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "from"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "from" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."mail_queue"."from" IS 'From: name & address'`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP COLUMN "run_time"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD "run_time" smallint NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "logs"."cron_history"."run_time" IS 'Run time in seconds'`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD "content" jsonb`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "logs"."cron_history"."content" IS 'Cron data'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_604c2b655029e47091f671ba875" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_ab3c66669facfe429164e60ab82" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_deb59c09715314aed1866e18a81" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_a592f2df24c9d464afd71401ff6" FOREIGN KEY ("permissionId") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" ADD CONSTRAINT "FK_fc9ce1c78c78fcde46bb1e25c47" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c0d597555330c0a972122bf4673" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_49f0631f07b3d8583418d65868d" FOREIGN KEY ("attributeLabelId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" ADD CONSTRAINT "FK_c1bf4950dee394db4b9cad06072" FOREIGN KEY ("attributeValueId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_8321a64a07b0586cca5295362e8" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_f2b48eda474233f6d180e41ecab" FOREIGN KEY ("labelId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_3b5f910ac6120a81eb5d97870fa" FOREIGN KEY ("slugId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" ADD CONSTRAINT "FK_d0c91413c9b99b994c8a656bce1" FOREIGN KEY ("descriptionId") REFERENCES "term"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD CONSTRAINT "FK_d5456fd7e4c4866fec8ada1fa10" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_930110e92aed1778939fdbdb302" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" ADD CONSTRAINT "FK_559e1bc4d01ef1e56d75117ab9c" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_fd22d97428d2b0c25be95fb3567" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" ADD CONSTRAINT "FK_9f8fcad8ca5a6000b79bf3c7475" FOREIGN KEY ("tagId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_3fb066240db56c9558a91139431" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" ADD CONSTRAINT "FK_073c85ed133e05241040bd70f02" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_8dcd5e98bc508c778553a3b7f72" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" ADD CONSTRAINT "FK_6002bfa369ac66d3a956119108b" FOREIGN KEY ("carrierId") REFERENCES "carrier"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "FK_9b27855a9c2ade186e5c55d1ec3" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_ec34a22f278ed238bb550f05622" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_07bcdbb42938702e79913c74cdb" FOREIGN KEY ("labelId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_2bd7be52d239a1339f9dda9b8a2" FOREIGN KEY ("slugId") REFERENCES "term"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" ADD CONSTRAINT "FK_30ffd61698fe0b6dae0f135625e" FOREIGN KEY ("descriptionId") REFERENCES "term"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
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
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_30ffd61698fe0b6dae0f135625e"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_2bd7be52d239a1339f9dda9b8a2"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_07bcdbb42938702e79913c74cdb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_content" DROP CONSTRAINT "FK_ec34a22f278ed238bb550f05622"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "FK_9b27855a9c2ade186e5c55d1ec3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_6002bfa369ac66d3a956119108b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_shipping" DROP CONSTRAINT "FK_8dcd5e98bc508c778553a3b7f72"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_073c85ed133e05241040bd70f02"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_product" DROP CONSTRAINT "FK_3fb066240db56c9558a91139431"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_9f8fcad8ca5a6000b79bf3c7475"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_tag" DROP CONSTRAINT "FK_fd22d97428d2b0c25be95fb3567"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_559e1bc4d01ef1e56d75117ab9c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_category" DROP CONSTRAINT "FK_930110e92aed1778939fdbdb302"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" DROP CONSTRAINT "FK_d5456fd7e4c4866fec8ada1fa10"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_d0c91413c9b99b994c8a656bce1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_3b5f910ac6120a81eb5d97870fa"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_f2b48eda474233f6d180e41ecab"`,
		);
		await queryRunner.query(
			`ALTER TABLE "category_content" DROP CONSTRAINT "FK_8321a64a07b0586cca5295362e8"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c1bf4950dee394db4b9cad06072"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_49f0631f07b3d8583418d65868d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_attribute" DROP CONSTRAINT "FK_c0d597555330c0a972122bf4673"`,
		);
		await queryRunner.query(
			`ALTER TABLE "order_invoice" DROP CONSTRAINT "FK_fc9ce1c78c78fcde46bb1e25c47"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_a592f2df24c9d464afd71401ff6"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_deb59c09715314aed1866e18a81"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_ab3c66669facfe429164e60ab82"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_604c2b655029e47091f671ba875"`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "logs"."cron_history"."content" IS 'Cron data'`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD "content" json`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "logs"."cron_history"."run_time" IS 'Run time in seconds'`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" DROP COLUMN "run_time"`,
		);
		await queryRunner.query(
			`ALTER TABLE "logs"."cron_history" ADD "run_time" integer NOT NULL DEFAULT '0'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."mail_queue"."from" IS 'From: name & address'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "from"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "from" json`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."mail_queue"."to" IS 'To: name & address'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "to"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "to" json NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."mail_queue"."content" IS 'Email content: subject, text, html, vars, layout'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."mail_queue" ADD "content" json NOT NULL`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "system"."template"."content" IS 'Template data'`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" DROP COLUMN "content"`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."template" ADD "content" json NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ALTER COLUMN "password_updated_at" SET DEFAULT now()`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN "user"."operator_type" IS 'Operator type; only relevant when role is OPERATOR'`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" DROP COLUMN "operator_type"`,
		);
		await queryRunner.query(`DROP TYPE "public"."user_operator_type_enum"`);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "permissionId"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" DROP COLUMN "userId"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_6a22002acac4976977b1efd114"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_4aa1348fc4b7da9bef0fae8ff4"`,
		);
		await queryRunner.query(`DROP TABLE "category_closure"`);
		await queryRunner.query(`COMMENT ON TABLE "discount" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_active"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_reference"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_reason"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_discount_scope"`);
		await queryRunner.query(`DROP TABLE "discount"`);
		await queryRunner.query(`DROP TYPE "public"."discount_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."discount_reason_enum"`);
		await queryRunner.query(`DROP TYPE "public"."discount_scope_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "product_content" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_product_content_slug_id"`,
		);
		await queryRunner.query(`DROP TABLE "product_content"`);
		await queryRunner.query(`COMMENT ON TABLE "client" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_client_cui"`);
		await queryRunner.query(`DROP TABLE "client"`);
		await queryRunner.query(`DROP TYPE "public"."client_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."client_client_type_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "order" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_issued_at"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_ref"`);
		await queryRunner.query(`DROP TABLE "order"`);
		await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
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
		await queryRunner.query(
			`DROP TYPE "public"."order_shipping_status_enum"`,
		);
		await queryRunner.query(`COMMENT ON TABLE "carrier" IS NULL`);
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
		await queryRunner.query(`DROP INDEX "public"."IDX_product_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_workflow"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_product_sku"`);
		await queryRunner.query(`DROP TABLE "product"`);
		await queryRunner.query(
			`DROP TYPE "public"."product_stock_status_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."product_type_enum"`);
		await queryRunner.query(
			`DROP TYPE "public"."product_sale_status_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."product_workflow_enum"`);
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
		await queryRunner.query(`DROP TYPE "public"."category_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."category_status_enum"`);
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
		await queryRunner.query(`DROP TYPE "public"."term_type_enum"`);
		await queryRunner.query(`COMMENT ON TABLE "order_invoice" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_invoice_code_number"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_invoice_status"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_order_invoice_order_id"`,
		);
		await queryRunner.query(`DROP TABLE "order_invoice"`);
		await queryRunner.query(
			`DROP TYPE "public"."order_invoice_status_enum"`,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "user" IS 'Stores email & page templates'`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_user_permission_permission_id" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_user_permission_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_account_token_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_account_recovery_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}
}
