import type { MigrationInterface, QueryRunner } from 'typeorm';

export class WithPlace1765731350064 implements MigrationInterface {
	name = 'WithPlace1765731350064';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_order_client_ref"`);
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
			`CREATE TYPE "public"."invoice_status_enum" AS ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."invoice_type_enum" AS ENUM('charge', 'proforma', 'credit_note')`,
		);
		await queryRunner.query(
			`CREATE TABLE "invoice" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "order_id" bigint NOT NULL, "ref_code" character(3) NOT NULL, "ref_number" integer NOT NULL, "status" "public"."invoice_status_enum" NOT NULL DEFAULT 'draft', "type" "public"."invoice_type_enum" NOT NULL DEFAULT 'charge', "base_currency" character(3) NOT NULL DEFAULT 'RON', "discount" jsonb, "issued_at" TIMESTAMP NOT NULL, "due_at" TIMESTAMP, "paid_at" TIMESTAMP, "billing_details" jsonb, "details" jsonb, "notes" text, CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id")); COMMENT ON COLUMN "invoice"."ref_code" IS 'Invoice series/code, e.g., ABC'; COMMENT ON COLUMN "invoice"."ref_number" IS 'Sequential invoice number within the series'; COMMENT ON COLUMN "invoice"."base_currency" IS 'Base currency for the invoice'; COMMENT ON COLUMN "invoice"."discount" IS 'Array of discount snapshots applied to this order'; COMMENT ON COLUMN "invoice"."billing_details" IS 'Snapshot of billing info at the moment of issuing the invoice'; COMMENT ON COLUMN "invoice"."details" IS 'Reserved column for future use'`,
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
			`CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'paused', 'cancelled', 'expired')`,
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
			`CREATE TYPE "public"."subscription_renewal_status_enum" AS ENUM('success', 'failed')`,
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
			`CREATE TYPE "public"."payment_gateway_enum" AS ENUM('stripe', 'paypal', 'manual')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."payment_status_enum" AS ENUM('pending', 'authorized', 'completed', 'failed', 'refunded', 'partially_refunded')`,
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
			`ALTER TABLE "order" DROP CONSTRAINT "UQ_c12cbb238d09ce1e94dcb11fba7"`,
		);
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "client_ref"`);
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
			`ALTER TABLE "order" ADD "ref_number" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "UQ_b8f1c6f7050e71f1ddb5b40684f" UNIQUE ("ref_number")`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."order_type_enum" AS ENUM('standard', 'subscription')`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD "type" "public"."order_type_enum" NOT NULL DEFAULT 'standard'`,
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
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c" UNIQUE ("article_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_order_ref_number" ON "order" ("ref_number") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_track_article_id_unique" ON "article_content" ("article_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_article_content_slug_lang" ON "article_content" ("slug", "language") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_article_content_unique_per_lang" ON "article_content" ("article_id", "language") `,
		);
		await queryRunner.query(
			`ALTER TABLE "invoice" ADD CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
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
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c"`,
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
			`ALTER TABLE "invoice" DROP CONSTRAINT "FK_1e74a9888e5e228184769ba3dfd"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_unique_per_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_content_slug_lang"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_article_track_article_id_unique"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_order_ref_number"`);
		await queryRunner.query(
			`ALTER TABLE "article_content" DROP CONSTRAINT "UQ_695e2a3fb3e8f1995d703d5b91c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "article_content" ADD CONSTRAINT "FK_695e2a3fb3e8f1995d703d5b91c" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "type"`);
		await queryRunner.query(`DROP TYPE "public"."order_type_enum"`);
		await queryRunner.query(
			`ALTER TABLE "order" DROP CONSTRAINT "UQ_b8f1c6f7050e71f1ddb5b40684f"`,
		);
		await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "ref_number"`);
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
			`ALTER TABLE "article_content" ADD "language" character(3) NOT NULL DEFAULT 'en'`,
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
			`ALTER TABLE "order" ADD "client_ref" character varying NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "order" ADD CONSTRAINT "UQ_c12cbb238d09ce1e94dcb11fba7" UNIQUE ("client_ref")`,
		);
		await queryRunner.query(`COMMENT ON TABLE "payment" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_payment_transaction_id"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_payment_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_payment_invoice_id"`);
		await queryRunner.query(`DROP TABLE "payment"`);
		await queryRunner.query(`DROP TYPE "public"."payment_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."payment_gateway_enum"`);
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
		await queryRunner.query(
			`DROP TYPE "public"."subscription_renewal_status_enum"`,
		);
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
		await queryRunner.query(
			`DROP TYPE "public"."subscription_status_enum"`,
		);
		await queryRunner.query(`COMMENT ON TABLE "invoice" IS NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_ref"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_type"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_status"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_invoice_order_id"`);
		await queryRunner.query(`DROP TABLE "invoice"`);
		await queryRunner.query(`DROP TYPE "public"."invoice_type_enum"`);
		await queryRunner.query(`DROP TYPE "public"."invoice_status_enum"`);
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
			`CREATE UNIQUE INDEX "IDX_order_client_ref" ON "order" ("client_ref") `,
		);
	}
}
