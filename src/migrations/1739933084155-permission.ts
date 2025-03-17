import {MigrationInterface, QueryRunner} from "typeorm";

export class Permission1739933084155 implements MigrationInterface {
    name = 'Permission1739933084155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`permission\`
            (
                \`id\`         BIGINT       NOT NULL AUTO_INCREMENT,
                \`entity\`     VARCHAR(255) NOT NULL,
                \`operation\`  VARCHAR(255) NOT NULL,
                \`deleted_at\` TIMESTAMP(6) NULL,
                UNIQUE INDEX \`IDX_permission\` (\`entity\`, \`operation\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`permission\``);
    }
}
