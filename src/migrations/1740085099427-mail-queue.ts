import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1740085099427 implements MigrationInterface {
    name = 'Init1740085099427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mail_queue\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`template_id\` bigint NULL, \`language\` char(2) NOT NULL, \`content\` json NOT NULL COMMENT 'Email content: subject, text, html', \`vars\` json NULL COMMENT 'Email vars', \`to\` json NOT NULL COMMENT 'To: name & address', \`from\` json NULL COMMENT 'From: name & address', \`status\` enum ('pending', 'sent', 'error') NOT NULL DEFAULT 'pending', \`error\` text NULL, \`sent_at\` timestamp NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_mail_queue_template_id\` (\`template_id\`), INDEX \`IDX_mail_queue_status\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_mail_queue_status\` ON \`mail_queue\``);
        await queryRunner.query(`DROP INDEX \`IDX_mail_queue_template_id\` ON \`mail_queue\``);
        await queryRunner.query(`DROP TABLE \`mail_queue\``);
    }

}
