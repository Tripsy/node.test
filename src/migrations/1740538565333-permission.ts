import { MigrationInterface, QueryRunner } from "typeorm";

export class Permission1740538565333 implements MigrationInterface {
    name = 'Permission1740538565333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`permission\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`entity\` varchar(255) NOT NULL, \`operation\` varchar(255) NOT NULL, \`deleted_at\` timestamp(6) NULL, UNIQUE INDEX \`IDX_permission\` (\`entity\`, \`operation\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_permission\` ON \`permission\``);
        await queryRunner.query(`DROP TABLE \`permission\``);
    }

}
