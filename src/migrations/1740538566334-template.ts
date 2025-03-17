import {MigrationInterface, QueryRunner} from "typeorm";

export class Template1740538566334 implements MigrationInterface {
    name = 'Template1740538566334'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`template\`
            (
                \`id\`         BIGINT                 NOT NULL AUTO_INCREMENT,
                \`label\`      VARCHAR(255)           NOT NULL,
                \`language\`   CHAR(2)                NOT NULL,
                \`type\`       ENUM ('page', 'email') NOT NULL DEFAULT 'page',
                \`content\`    JSON                   NOT NULL COMMENT 'Template data',
                \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` TIMESTAMP(6) NULL     DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` TIMESTAMP(6) NULL,            
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_template\` (\`label\`, \`language\`, \`type\`)
            ) ENGINE = InnoDB;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`template\`;`);
    }
}
