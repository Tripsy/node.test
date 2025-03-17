import {MigrationInterface, QueryRunner} from "typeorm";

export class MailQueue1740538567334 implements MigrationInterface {
    name = 'MailQueue1740538567334'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`mail_queue\`
            (
                \`id\`          BIGINT                            NOT NULL AUTO_INCREMENT,
                \`template_id\` BIGINT                            NULL,
                \`language\`    CHAR(2)                           NOT NULL,
                \`content\`     JSON                              NOT NULL COMMENT 'Email content: subject, text, html',
                \`vars\`        JSON                              NULL COMMENT 'Email vars',
                \`to\`          JSON                              NOT NULL COMMENT 'To: name & address',
                \`from\`        JSON                              NULL COMMENT 'From: name & address',
                \`status\`      ENUM ('pending', 'sent', 'error') NOT NULL DEFAULT 'pending',
                \`error\`       TEXT                              NULL,
                \`sent_at\`     TIMESTAMP                         NULL,
                \`created_at\`  TIMESTAMP(6)                      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\`  TIMESTAMP(6)                      NULL     DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_mail_queue_template_id\` (\`template_id\`),
                INDEX \`IDX_mail_queue_status\` (\`status\`)
            ) ENGINE = InnoDB;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`mail_queue\`;`);
    }
}
