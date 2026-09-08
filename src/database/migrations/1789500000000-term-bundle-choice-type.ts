import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `bundle_choice` to `term_type_enum`, the type a bundle's choice prompts are stored under.
 *
 * They were written as `text` while `product_bundle_group` was being built. That is the
 * general-purpose type, so the prompt picker was searching the same pool as every other
 * free-standing string — a list too broad to choose from, and one an operator could pollute by
 * creating a prompt that then shows up wherever `text` terms are offered.
 *
 * Renamed and recreated rather than `ALTER TYPE ... ADD VALUE`, the shape
 * `ComplaintReasonEnum1787800000000` established: `ADD VALUE` cannot be followed by a use of the
 * new value in the same transaction, and TypeORM runs a migration inside one.
 *
 * Existing rows keep the type they have. Prompts already written as `text` stay `text` and stop
 * appearing in the picker — there is no way to tell them apart from any other `text` term, so
 * guessing would reclassify strings that were never prompts. Re-pick the prompt on any bundle
 * choice saved before this.
 */
export class TermBundleChoiceType1789500000000 implements MigrationInterface {
	name = 'TermBundleChoiceType1789500000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."term_type_enum" RENAME TO "term_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."term_type_enum" AS ENUM('tag', 'attribute_label', 'attribute_value', 'text', 'bundle_choice')`,
		);
		await queryRunner.query(
			`ALTER TABLE "term" ALTER COLUMN "type" TYPE "public"."term_type_enum" USING "type"::text::"public"."term_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."term_type_enum_old"`);
	}

	/**
	 * Any term written as `bundle_choice` becomes `text` on the way back — the type it would have
	 * been written as before this migration. The bundle choices pointing at it keep working: a
	 * `label_id` is a plain foreign key to `term` and the backend accepts any type behind it. Only
	 * the picker's filter narrows, so the prompt still renders and only re-picking it is affected.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."term_type_enum" RENAME TO "term_type_enum_new"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."term_type_enum" AS ENUM('tag', 'attribute_label', 'attribute_value', 'text')`,
		);
		await queryRunner.query(
			`ALTER TABLE "term" ALTER COLUMN "type" TYPE "public"."term_type_enum" USING (CASE WHEN "type"::text = 'bundle_choice' THEN 'text' ELSE "type"::text END)::"public"."term_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."term_type_enum_new"`);
	}
}
