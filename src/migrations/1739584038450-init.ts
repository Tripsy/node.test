import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1739584038450 implements MigrationInterface {
    name = 'Init1739584038450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`account_token\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`user_id\` bigint NOT NULL, \`ident\` char(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`metadata\` json NULL COMMENT 'Fingerprinting data', \`used_at\` timestamp NULL, \`expire_at\` timestamp NOT NULL, INDEX \`IDX_account_token_user_id\` (\`user_id\`), UNIQUE INDEX \`IDX_account_token_ident\` (\`ident\`), UNIQUE INDEX \`IDX_b75a07f32c73a249ab14d7f052\` (\`ident\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB COMMENT="Stores \`ident\` for account tokens to manage token revocation"`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`status\` enum ('active', 'inactive', 'pending') NOT NULL DEFAULT 'pending', UNIQUE INDEX \`IDX_user_email\` (\`email\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`account_token\` ADD CONSTRAINT \`FK_account_token_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`account_token\` DROP FOREIGN KEY \`FK_account_token_user_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_user_email\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_b75a07f32c73a249ab14d7f052\` ON \`account_token\``);
        await queryRunner.query(`DROP INDEX \`IDX_account_token_ident\` ON \`account_token\``);
        await queryRunner.query(`DROP INDEX \`IDX_account_token_user_id\` ON \`account_token\``);
        await queryRunner.query(`DROP TABLE \`account_token\``);
    }

}
