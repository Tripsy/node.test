import {Router} from 'express';
import {buildSrcPath} from '../helpers/system';
import fs from 'fs/promises';

const router: Router = Router();

const loadRoutes = async (router: Router) => {
    const routesDir = buildSrcPath('routes');
    const files = await fs.readdir(routesDir);

    if (files.length === 0) {
        throw new Error('No routes found');
    }

    for (const file of files) {
        if (file.endsWith('.routes.ts')) {
            const routeModule = await import(buildSrcPath('routes', file));

            if (typeof routeModule.default === 'function') {
                router.use('/', routeModule.default);
            } else {
                throw new Error(` ${file} does not export a valid router.`);
            }
        }
    }
};

// Load routes dynamically and export the router
export const initRoutesService = async (): Promise<Router> => {
    await loadRoutes(router);
    return router;
};
