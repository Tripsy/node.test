import dataSource from '../config/data-source.config';
import PermissionEntity from '../entities/permission.entity';

/**
 * The `delete` action is also considered for `restore` action
 */
const permissionArray = {
    'user': ['create', 'read', 'update', 'delete', 'find'],
    'permission': ['create', 'read', 'update', 'delete', 'find'], // Also used in user-permission.controller
    'template': ['create', 'read', 'update', 'delete', 'find'],
};

async function seedPermissions() {
    try {
        console.log('Initializing database connection...');
        await dataSource.initialize();

        const permissionData: { entity: string; operation: string }[] = [];

        for (const [entity, operations] of Object.entries(permissionArray)) {
            for (const operation of operations) {
                permissionData.push({ entity, operation });
            }
        }

        console.log('Seeding permissions...');

        await dataSource
            .createQueryBuilder()
            .insert()
            .into(PermissionEntity)
            .values(permissionData)
            .orIgnore() // Ignores if (entity, operation) already exists
            .execute();

        console.log('Permissions seeded successfully ✅');
    } catch (error) {
        console.error('Error seeding permissions:', error);
    } finally {
        await dataSource.destroy();
        console.log('Database connection closed.');
    }
}

(async () => {
    await seedPermissions();
})();