import { MigrationInterface, QueryRunner } from "typeorm";

export class CronHistory1739933085355 implements MigrationInterface {
    name = 'CronHistory1739933085355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`cron_history\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`label\` varchar(255) NOT NULL, \`start_at\` timestamp NOT NULL, \`end_at\` timestamp NOT NULL, \`status\` enum ('error', 'ok', 'warning') NOT NULL, \`run_time\` int NOT NULL COMMENT 'Run time in seconds' DEFAULT '0', \`content\` json NULL COMMENT 'Cron data', INDEX \`IDX_cron_history_start_at\` (\`start_at\`), INDEX \`IDX_cron_history_status\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB COMMENT="Stores cron usage"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_cron_history_status\` ON \`cron_history\``);
        await queryRunner.query(`DROP INDEX \`IDX_cron_history_start_at\` ON \`cron_history\``);
        await queryRunner.query(`DROP TABLE \`cron_history\``);
    }

}
