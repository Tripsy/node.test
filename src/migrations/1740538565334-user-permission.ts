import { MigrationInterface, QueryRunner } from "typeorm";

export class UserPermission1740538565334 implements MigrationInterface {
    name = 'UserPermission1740538565334'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_permission\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`user_id\` bigint NOT NULL, \`permission_id\` bigint NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`deleted_at\` timestamp(6) NULL, UNIQUE INDEX \`IDX_user_permission_permission\` (\`user_id\`, \`permission_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB COMMENT="Stores user permissions"`);
        await queryRunner.query(`ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_user_permission_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_user_permission_permission_id\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permission\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_user_permission_permission_id\``);
        await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_user_permission_user_id\``);
        await queryRunner.query(`DROP TABLE \`user_permission\``);
    }
}
