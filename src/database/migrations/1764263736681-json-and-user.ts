import type { MigrationInterface, QueryRunner } from 'typeorm';

export class JsonAndUser1764263736681 implements MigrationInterface {
	name = 'JsonAndUser1764263736681';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user" ADD "email_verified_at" TIMESTAMP`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" ADD "password_updated_at" TIMESTAMP NOT NULL DEFAULT NOW()`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user" DROP COLUMN "password_updated_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "user" DROP COLUMN "email_verified_at"`,
		);
	}
}
