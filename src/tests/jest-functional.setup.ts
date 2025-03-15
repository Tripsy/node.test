import {appReady, closeHandler, server} from '../app';

beforeAll(async () => {
    await appReady;
});

afterAll(async () => {
    if (server) {
        await new Promise<void>((resolve, reject) => {
            server.close(async (err) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        await closeHandler();

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        });
    } else {
        await closeHandler();
    }
});