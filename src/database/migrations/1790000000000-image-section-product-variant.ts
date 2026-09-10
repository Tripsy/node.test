import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `product_variant` to `image_section_enum`, so a variant can own a gallery of its own.
 *
 * A product's photographs describe the thing; a variant's describe the one you are buying - the
 * blue jacket rather than the jacket. Without this the storefront's per-variant catalog cards all
 * carry the same picture, which is the shape of listing they exist to avoid.
 *
 * Renamed and recreated rather than `ALTER TYPE ... ADD VALUE`, the shape
 * `TermBundleChoiceType1789500000000` established: `ADD VALUE` cannot be followed by a use of the
 * new value in the same transaction, and TypeORM runs a migration inside one.
 *
 * The section is the owner's table name here, as it is for every other value - `product_variant`,
 * not the kebab-case `product-variant` a permission entity would use. `(section, entity_id)`
 * carries no foreign key, so nothing in the schema ties these rows to the variants they describe;
 * cleanup rides on the `entityRemoved` event, which fires on a hard delete. A variant is
 * soft-deleted, so its images outlive it - the same gap products already have, not a new one.
 */
export class ImageSectionProductVariant1790000000000
	implements MigrationInterface
{
	name = 'ImageSectionProductVariant1790000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."image_section_enum" RENAME TO "image_section_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."image_section_enum" AS ENUM('product', 'category', 'brand', 'article', 'product_variant')`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" ALTER COLUMN "section" TYPE "public"."image_section_enum" USING "section"::text::"public"."image_section_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."image_section_enum_old"`);
	}

	/**
	 * Variant images are deleted on the way back rather than re-filed against their product.
	 * There is no honest section left for them: moving them to `product` would put a picture of
	 * one variant on the product itself, and `entity_id` points at a variant id that means
	 * something different in that section. The files they name are left in storage - this feature
	 * records where a file is and never touches it, and `down` has no upload path to undo.
	 */
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DELETE FROM "image" WHERE "section" = 'product_variant'`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."image_section_enum" RENAME TO "image_section_enum_new"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."image_section_enum" AS ENUM('product', 'category', 'brand', 'article')`,
		);
		await queryRunner.query(
			`ALTER TABLE "image" ALTER COLUMN "section" TYPE "public"."image_section_enum" USING "section"::text::"public"."image_section_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."image_section_enum_new"`);
	}
}
