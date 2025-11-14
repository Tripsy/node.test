import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1763145251818 implements MigrationInterface {
    name = 'Init1763145251818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system"."account_token" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "ident" character(36) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" json, "used_at" TIMESTAMP, "expire_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_b75a07f32c73a249ab14d7f052f" UNIQUE ("ident"), CONSTRAINT "PK_a55842d3341d42534e39f85e931" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_token"."metadata" IS 'Fingerprinting data'`);
        await queryRunner.query(`CREATE INDEX "IDX_account_token_user_id" ON "system"."account_token" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_account_token_ident" ON "system"."account_token" ("ident") `);
        await queryRunner.query(`COMMENT ON TABLE "system"."account_token" IS 'Stores \`ident\` for account tokens to manage token revocation'`);
        await queryRunner.query(`CREATE TABLE "system"."account_recovery" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "ident" character(36) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" json, "used_at" TIMESTAMP, "expire_at" TIMESTAMP NOT NULL, CONSTRAINT "UQ_a298b664b11e30efbcbdf35aa06" UNIQUE ("ident"), CONSTRAINT "PK_d4901111d598239fd13e230f618" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."account_recovery"."metadata" IS 'Fingerprinting data'`);
        await queryRunner.query(`CREATE INDEX "IDX_account_recovery_user_id" ON "system"."account_recovery" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_account_recovery_ident" ON "system"."account_recovery" ("ident") `);
        await queryRunner.query(`COMMENT ON TABLE "system"."account_recovery" IS 'Stores \`ident\` for account password recovery requests'`);
        await queryRunner.query(`CREATE TABLE "system"."permission" ("id" BIGSERIAL NOT NULL, "entity" character varying NOT NULL, "operation" character varying NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_permission" ON "system"."permission" ("entity", "operation") `);
        await queryRunner.query(`COMMENT ON TABLE "system"."permission" IS 'Stores permissions'`);
        await queryRunner.query(`CREATE TABLE "user_permission" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "permission_id" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_a7326749e773c740a7104634a77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_permission_permission" ON "user_permission" ("user_id", "permission_id") `);
        await queryRunner.query(`COMMENT ON TABLE "user_permission" IS 'Stores user permissions'`);
        await queryRunner.query(`CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'inactive', 'pending')`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'member', 'operator')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "language" character(2) NOT NULL, "status" "public"."user_status_enum" NOT NULL DEFAULT 'pending', "role" "public"."user_role_enum" NOT NULL DEFAULT 'member', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_email" ON "user" ("email") `);
        await queryRunner.query(`COMMENT ON TABLE "user" IS 'Stores email & page templates'`);
        await queryRunner.query(`CREATE TYPE "logs"."log_data_level_enum" AS ENUM('trace', 'debug', 'info', 'warn', 'error', 'fatal')`);
        await queryRunner.query(`CREATE TABLE "logs"."log_data" ("id" BIGSERIAL NOT NULL, "pid" character(36) NOT NULL, "category" character varying NOT NULL, "level" "logs"."log_data_level_enum" NOT NULL, "message" text NOT NULL, "context" text, "debugStack" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee6ddd7720fe93171a6b62e4be6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_log_data_pid" ON "logs"."log_data" ("pid") `);
        await queryRunner.query(`CREATE INDEX "idx_log_data" ON "logs"."log_data" ("created_at", "level", "category") `);
        await queryRunner.query(`CREATE TYPE "system"."template_type_enum" AS ENUM('page', 'email')`);
        await queryRunner.query(`CREATE TABLE "system"."template" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "label" character varying NOT NULL, "language" character(2) NOT NULL, "type" "system"."template_type_enum" NOT NULL DEFAULT 'page', "content" json NOT NULL, CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."template"."content" IS 'Template data'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_label_language_type" ON "system"."template" ("label", "language", "type") `);
        await queryRunner.query(`COMMENT ON TABLE "system"."template" IS 'Stores email & page templates'`);
        await queryRunner.query(`CREATE TYPE "system"."mail_queue_status_enum" AS ENUM('pending', 'sent', 'error')`);
        await queryRunner.query(`CREATE TABLE "system"."mail_queue" ("id" BIGSERIAL NOT NULL, "template_id" bigint, "language" character(2) NOT NULL, "content" json NOT NULL, "to" json NOT NULL, "from" json, "status" "system"."mail_queue_status_enum" NOT NULL DEFAULT 'pending', "error" text, "sent_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_fc59283e1a31da3ce216089305b" PRIMARY KEY ("id")); COMMENT ON COLUMN "system"."mail_queue"."content" IS 'Email content: subject, text, html, vars, layout'; COMMENT ON COLUMN "system"."mail_queue"."to" IS 'To: name & address'; COMMENT ON COLUMN "system"."mail_queue"."from" IS 'From: name & address'`);
        await queryRunner.query(`CREATE INDEX "IDX_mail_queue_template_id" ON "system"."mail_queue" ("template_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_mail_queue_status" ON "system"."mail_queue" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_mail_queue_sent_at" ON "system"."mail_queue" ("sent_at") `);
        await queryRunner.query(`CREATE TYPE "logs"."cron_history_status_enum" AS ENUM('error', 'ok', 'warning')`);
        await queryRunner.query(`CREATE TABLE "logs"."cron_history" ("id" BIGSERIAL NOT NULL, "label" character varying NOT NULL, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "status" "logs"."cron_history_status_enum" NOT NULL, "run_time" integer NOT NULL DEFAULT '0', "content" json, CONSTRAINT "PK_459b846bf883b0de2833b411c19" PRIMARY KEY ("id")); COMMENT ON COLUMN "logs"."cron_history"."run_time" IS 'Run time in seconds'; COMMENT ON COLUMN "logs"."cron_history"."content" IS 'Cron data'`);
        await queryRunner.query(`CREATE INDEX "IDX_cron_history_start_at" ON "logs"."cron_history" ("start_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_cron_history_status" ON "logs"."cron_history" ("status") `);
        await queryRunner.query(`COMMENT ON TABLE "logs"."cron_history" IS 'Stores cron usage'`);
        await queryRunner.query(`ALTER TABLE "system"."account_token" ADD CONSTRAINT "FK_account_token_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."account_recovery" ADD CONSTRAINT "FK_account_recovery_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_user_permission_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permission" ADD CONSTRAINT "FK_user_permission_permission_id" FOREIGN KEY ("permission_id") REFERENCES "system"."permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_user_permission_permission_id"`);
        await queryRunner.query(`ALTER TABLE "user_permission" DROP CONSTRAINT "FK_user_permission_user_id"`);
        await queryRunner.query(`ALTER TABLE "system"."account_recovery" DROP CONSTRAINT "FK_account_recovery_user_id"`);
        await queryRunner.query(`ALTER TABLE "system"."account_token" DROP CONSTRAINT "FK_account_token_user_id"`);
        await queryRunner.query(`COMMENT ON TABLE "logs"."cron_history" IS NULL`);
        await queryRunner.query(`DROP INDEX "logs"."IDX_cron_history_status"`);
        await queryRunner.query(`DROP INDEX "logs"."IDX_cron_history_start_at"`);
        await queryRunner.query(`DROP TABLE "logs"."cron_history"`);
        await queryRunner.query(`DROP TYPE "logs"."cron_history_status_enum"`);
        await queryRunner.query(`DROP INDEX "system"."IDX_mail_queue_sent_at"`);
        await queryRunner.query(`DROP INDEX "system"."IDX_mail_queue_status"`);
        await queryRunner.query(`DROP INDEX "system"."IDX_mail_queue_template_id"`);
        await queryRunner.query(`DROP TABLE "system"."mail_queue"`);
        await queryRunner.query(`DROP TYPE "system"."mail_queue_status_enum"`);
        await queryRunner.query(`COMMENT ON TABLE "system"."template" IS NULL`);
        await queryRunner.query(`DROP INDEX "system"."IDX_label_language_type"`);
        await queryRunner.query(`DROP TABLE "system"."template"`);
        await queryRunner.query(`DROP TYPE "system"."template_type_enum"`);
        await queryRunner.query(`DROP INDEX "logs"."idx_log_data"`);
        await queryRunner.query(`DROP INDEX "logs"."IDX_log_data_pid"`);
        await queryRunner.query(`DROP TABLE "logs"."log_data"`);
        await queryRunner.query(`DROP TYPE "logs"."log_data_level_enum"`);
        await queryRunner.query(`COMMENT ON TABLE "user" IS NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
        await queryRunner.query(`COMMENT ON TABLE "user_permission" IS NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_permission_permission"`);
        await queryRunner.query(`DROP TABLE "user_permission"`);
        await queryRunner.query(`COMMENT ON TABLE "system"."permission" IS NULL`);
        await queryRunner.query(`DROP INDEX "system"."IDX_permission"`);
        await queryRunner.query(`DROP TABLE "system"."permission"`);
        await queryRunner.query(`COMMENT ON TABLE "system"."account_recovery" IS NULL`);
        await queryRunner.query(`DROP INDEX "system"."IDX_account_recovery_ident"`);
        await queryRunner.query(`DROP INDEX "system"."IDX_account_recovery_user_id"`);
        await queryRunner.query(`DROP TABLE "system"."account_recovery"`);
        await queryRunner.query(`COMMENT ON TABLE "system"."account_token" IS NULL`);
        await queryRunner.query(`DROP INDEX "system"."IDX_account_token_ident"`);
        await queryRunner.query(`DROP INDEX "system"."IDX_account_token_user_id"`);
        await queryRunner.query(`DROP TABLE "system"."account_token"`);
    }

}
