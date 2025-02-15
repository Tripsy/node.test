import dataSource from '../config/data-source.config';

export const initDatabase = async () => {
    try {
        await dataSource.initialize();
    } catch (error) {
        throw error;
    }
};

export const destroyDatabase = async () => {
    if (dataSource) {
        try {
            await dataSource.destroy();
        } catch (error) {
            throw error;
        }
    }
};