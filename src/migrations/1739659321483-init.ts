import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1739659321483 implements MigrationInterface {
    name = 'Init1739659321483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`account_recovery\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`user_id\` bigint NOT NULL, \`ident\` char(36) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`metadata\` json NULL COMMENT 'Fingerprinting data', \`used_at\` timestamp NULL, \`expire_at\` timestamp NOT NULL, INDEX \`IDX_account_token_user_id\` (\`user_id\`), UNIQUE INDEX \`IDX_account_token_ident\` (\`ident\`), UNIQUE INDEX \`IDX_a298b664b11e30efbcbdf35aa0\` (\`ident\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB COMMENT="Stores \`ident\` for account password recovery requests"`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`language\` char(2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`account_token\` CHANGE \`expire_at\` \`expire_at\` timestamp NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`account_recovery\` ADD CONSTRAINT \`FK_account_token_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`account_recovery\` DROP FOREIGN KEY \`FK_account_token_user_id\``);
        await queryRunner.query(`ALTER TABLE \`account_token\` CHANGE \`expire_at\` \`expire_at\` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`language\``);
        await queryRunner.query(`DROP INDEX \`IDX_a298b664b11e30efbcbdf35aa0\` ON \`account_recovery\``);
        await queryRunner.query(`DROP INDEX \`IDX_account_token_ident\` ON \`account_recovery\``);
        await queryRunner.query(`DROP INDEX \`IDX_account_token_user_id\` ON \`account_recovery\``);
        await queryRunner.query(`DROP TABLE \`account_recovery\``);
    }

}
