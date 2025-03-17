import {MigrationInterface, QueryRunner} from "typeorm";

export class AccountRecovery1739933085265 implements MigrationInterface {
    name = 'AccountRecovery1739933085265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`account_recovery\`
            (
                \`id\`         BIGINT       NOT NULL AUTO_INCREMENT,
                \`user_id\`    BIGINT       NOT NULL,
                \`ident\`      CHAR(36)     NOT NULL UNIQUE,
                \`created_at\` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`metadata\`   JSON         NULL COMMENT 'Fingerprinting data',
                \`used_at\`    TIMESTAMP    NULL,
                \`expire_at\`  TIMESTAMP    NOT NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_account_recovery_user_id\` (\`user_id\`),
                CONSTRAINT \`FK_account_recovery_user_id\`
                    FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`)
                        ON DELETE CASCADE
            ) ENGINE = InnoDB
                COMMENT ="Stores \`ident\` for account password recovery requests";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`account_recovery\`
            DROP FOREIGN KEY \`FK_account_recovery_user_id\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`account_recovery\`;`);
    }
}
