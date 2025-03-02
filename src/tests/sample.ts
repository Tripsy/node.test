// import request from 'supertest';
// import app from '../app';
// import { initDatabase } from '../providers/database.provider';
//
// beforeAll(async () => {
//     await initDatabase();
// });
//
// describe('Email API', () => {
//     it('should enqueue an email', async () => {
//         const res = await request(app)
//             .post('/api/emails')
//             .send({ to: 'test@example.com', template: 'email-confirm' });
//
//         expect(res.status).toBe(201);
//         expect(res.body.status).toBe('queued');
//     });
// });
