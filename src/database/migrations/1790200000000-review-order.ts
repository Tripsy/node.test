import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `review.order_id` - which order the reviewed purchase was made on, when it is known.
 *
 * Nullable, and null on every row for now: nothing writes it yet, because a review names a `user`
 * while an order names a `client` and no column joins the two (TODO.md item 8). The column exists
 * so the provenance has somewhere to land the day that link does, and it stays nullable
 * afterwards - a review written from a product page or imported from elsewhere names no order.
 *
 * `ON DELETE SET NULL`, unlike the catalog keys on this table: the review is the reader's, not the
 * order's, so a purged order costs it its provenance rather than its existence.
 *
 * Written by hand from the generated output, keeping only the statements this change owns - the
 * generator also picks up drift the dev database carries from other branches. The foreign-key
 * name is TypeORM's own hash, kept verbatim so a future generate does not see a difference and
 * try to recreate it.
 */
export class ReviewOrder1790200000000 implements MigrationInterface {
	name = 'ReviewOrder1790200000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "review" ADD "order_id" integer`);
		// The referencing side of the key, which Postgres does not index on its own - without it
		// every hard delete of an order scans this table. Partial: the column is null on most
		// rows, and a lookup by order implies the predicate anyway.
		await queryRunner.query(
			`CREATE INDEX "IDX_review_order" ON "review" ("order_id") WHERE order_id IS NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "review" ADD CONSTRAINT "FK_d816563052236db6adc852f90ee" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "review" DROP CONSTRAINT "FK_d816563052236db6adc852f90ee"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_review_order"`);
		await queryRunner.query(`ALTER TABLE "review" DROP COLUMN "order_id"`);
	}
}
