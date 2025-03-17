import {MigrationInterface, QueryRunner} from "typeorm";

export class UserPermission1742169552434 implements MigrationInterface {
    name = 'UserPermission1742169552434';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the 'user_permission' table
        await queryRunner.query(`
            CREATE TABLE \`user_permission\`
            (
                \`id\`            bigint       NOT NULL AUTO_INCREMENT,
                \`user_id\`       bigint       NOT NULL,
                \`permission_id\` bigint       NOT NULL,
                \`created_at\`    timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`deleted_at\`    timestamp(6) NULL,
                UNIQUE INDEX \`IDX_user_permission_permission\` (\`user_id\`, \`permission_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB COMMENT ="Stores user permissions";
        `);

        // Add a foreign key constraint on 'user_id' to reference the 'user' table
        await queryRunner.query(`
            ALTER TABLE \`user_permission\`
                ADD CONSTRAINT \`FK_user_permission_user_id\`
                    FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`)
                        ON DELETE CASCADE ON UPDATE NO ACTION;
        `);

        // Add a foreign key constraint on 'permission_id' to reference the 'permission' table
        await queryRunner.query(`
            ALTER TABLE \`user_permission\`
                ADD CONSTRAINT \`FK_user_permission_permission_id\`
                    FOREIGN KEY (\`permission_id\`) REFERENCES \`permission\` (\`id\`)
                        ON DELETE CASCADE ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the foreign key constraint for 'permission_id'
        await queryRunner.query(`
            ALTER TABLE \`user_permission\`
                DROP FOREIGN KEY \`FK_user_permission_permission_id\`;
        `);

        // Remove the foreign key constraint for 'user_id'
        await queryRunner.query(`
            ALTER TABLE \`user_permission\`
                DROP FOREIGN KEY \`FK_user_permission_user_id\`;
        `);

        // Drop the unique index for 'user_id' and 'permission_id'
        await queryRunner.query(`
            DROP INDEX \`IDX_user_permission_permission\` ON \`user_permission\`;
        `);

        // Finally, delete the 'user_permission' table
        await queryRunner.query(`
            DROP TABLE \`user_permission\`;
        `);
    }
}
