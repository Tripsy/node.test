import {MigrationInterface, QueryRunner} from "typeorm";

export class User1739933085155 implements MigrationInterface {
    name = 'User1739933085155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`user\`
            (
                \`id\`         BIGINT       NOT NULL AUTO_INCREMENT,
                \`name\`       VARCHAR(255) NOT NULL,
                \`email\`      VARCHAR(255) NOT NULL UNIQUE,
                \`password\`   VARCHAR(255) NOT NULL,
                \`language\`   CHAR(2)      NOT NULL,
                \`status\`     ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'pending',
                \`role\`       ENUM('admin', 'member', 'operator') NOT NULL DEFAULT 'member',
                \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` TIMESTAMP(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` TIMESTAMP(6) NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`user\`;`);
    }
}
