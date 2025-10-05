import {MigrationInterface, QueryRunner} from "typeorm";

export class LogData1740538568334 implements MigrationInterface {
    name = 'LogData1740538568334';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`log_data\`
            (
                \`id\`              BIGINT                                                    NOT NULL AUTO_INCREMENT,
                \`pid\`             CHAR(36)                                                  NOT NULL,
                \`category\`        VARCHAR(255)                                              NOT NULL,
                \`level\`           ENUM ('trace', 'debug', 'info', 'warn', 'error', 'fatal') NOT NULL,
                \`message\`         TEXT                                                      NOT NULL,
                \`context\`         TEXT                                                      NULL,
                \`debugStack\`      TEXT                                                      NULL,
                \`created_at\`      TIMESTAMP(6)                                              NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_log_data_pid\` (\`pid\`),
                INDEX \`IDX__log_data\` (\`created_at\`, \`level\`, \`category\`)
            ) ENGINE = InnoDB;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`log_data\`;`);
    }
}
