import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `exchange_rate` - what one unit of `currency` was worth in `base_currency` on a given day.
 *
 * Generation also picked up unrelated drift from entities that have no migration yet (`review`,
 * and two `document_series` columns), which is stripped here: this migration creates the new
 * table and nothing else.
 */
export class ExchangeRate1788260566851 implements MigrationInterface {
	name = 'ExchangeRate1788260566851';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."exchange_rate_source_enum" AS ENUM('manual', 'import')`,
		);
		await queryRunner.query(
			`CREATE TABLE "exchange_rate" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "currency" character(3) NOT NULL, "base_currency" character(3) NOT NULL, "rate" numeric(14,8) NOT NULL, "rate_date" date NOT NULL, "source" "public"."exchange_rate_source_enum" NOT NULL DEFAULT 'manual', "provider" character varying(50), "notes" text, CONSTRAINT "CHK_fbdbbbb0fe8982eecf6944a710" CHECK (
	(source = 'import' AND provider IS NOT NULL)
	OR
	(source = 'manual' AND provider IS NULL)
), CONSTRAINT "CHK_e5971c61645c49d894b8910a3b" CHECK ((currency <> base_currency)), CONSTRAINT "CHK_f0363b25f1334572e0f12456e3" CHECK ((rate > 0)), CONSTRAINT "PK_5c5d27d2b900ef6cdeef0398472" PRIMARY KEY ("id")); COMMENT ON COLUMN "exchange_rate"."currency" IS 'ISO 4217 code being priced; the rate is for one unit of it'; COMMENT ON COLUMN "exchange_rate"."base_currency" IS 'ISO 4217 code the rate is expressed in; the deployment''s own'; COMMENT ON COLUMN "exchange_rate"."rate" IS 'Units of \`base_currency\` per one unit of \`currency\`'; COMMENT ON COLUMN "exchange_rate"."rate_date" IS 'Day the rate applies to'; COMMENT ON COLUMN "exchange_rate"."provider" IS 'Name of the feed the rate was imported from; NULL when manual'`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_exchange_rate_unique" ON "exchange_rate"  ("currency", "base_currency", "rate_date") `,
		);
		await queryRunner.query(
			`COMMENT ON TABLE "exchange_rate" IS 'Published exchange rates per currency and day'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`COMMENT ON TABLE "exchange_rate" IS NULL`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_exchange_rate_unique"`,
		);
		await queryRunner.query(`DROP TABLE "exchange_rate"`);
		await queryRunner.query(
			`DROP TYPE "public"."exchange_rate_source_enum"`,
		);
	}
}
