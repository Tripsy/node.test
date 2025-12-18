import dataSource from '@/config/data-source.config';
import PermissionEntity from '@/features/permission/permission.entity';

/**
 * The `delete` action is also considered for `restore` action
 */
const permissionArray = {
	user: ['create', 'read', 'update', 'delete', 'find'],
	permission: ['create', 'read', 'update', 'delete', 'find'], // Also used in user-permission.controller
	template: ['create', 'read', 'update', 'delete', 'find'],
	'log-data': ['read', 'delete', 'find'],
	'cron-history': ['read', 'delete', 'find'],
};

async function seedPermissions() {
    const connection = dataSource;

    try {
        console.log('Initializing database connection...');
        await connection.initialize();

        const permissionData: { entity: string; operation: string }[] = [];

        for (const [entity, operations] of Object.entries(permissionArray)) {
            for (const operation of operations) {
                permissionData.push({ entity, operation });
            }
        }

        console.log('Seeding permissions...');
        console.log(`Inserting ${permissionData.length} permission records...`);

        await connection
            .createQueryBuilder()
            .insert()
            .into(PermissionEntity)
            .values(permissionData)
            .orIgnore() // Ignores if (entity, operation) already exists
            .execute();

        console.log('Permissions seeded successfully ✅');

    } catch (error) {
        console.error('Error seeding permissions:', error);
        throw error;

    } finally {
        // Only destroy if the connection was initialized
        if (connection?.isInitialized) {
            // Wait a moment to ensure all operations are complete
            await new Promise(resolve => setTimeout(resolve, 500));
            await connection.destroy();
            console.log('Database connection closed.');
        }
    }
}

(async () => {
    try {
        await seedPermissions();
        process.exit(0); // Exit successfully
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1); // Exit with error code
    }
})();
