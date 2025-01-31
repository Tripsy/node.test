import AppDataSource from '../config/data-source';

export const initializeDatabase = async () => {
    await AppDataSource.initialize();
};

export const destroyDatabase = async () => {
    await AppDataSource.destroy();
};
