import {Router} from 'express';
import {buildSrcPath} from '../helpers/system';
import fs from 'fs/promises';

const router: Router = Router();

const loadRoutes = async (router: Router): Promise<void> => {
    const routesDir = buildSrcPath('routes');
    const files = await fs.readdir(routesDir);

    // Filter files that end with '.routes.ts'
    const routeFiles = files.filter((file) => file.endsWith('.routes.ts'));

    if (routeFiles.length === 0) {
        throw Error('No route files found');
    }

    // Load all route modules in parallel
    await Promise.all(
        routeFiles.map(async (file) => {
            const routeModule = await import(buildSrcPath('routes', file));

            if (typeof routeModule.default === 'function') {
                router.use('/', routeModule.default);
            } else {
                throw new Error(`${file} does not export a valid router.`);
            }
        })
    );
};

// Load routes dynamically and export the router
export const initRoutes = async (): Promise<Router> => {
    try {
        await loadRoutes(router);
        return router;
    } catch (error) {
        throw error;
    }
};
