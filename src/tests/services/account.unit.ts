import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as accountService from '../../services/account.service';
import AccountTokenRepository from '../../repositories/account-token.repository';
import AccountRecoveryRepository from '../../repositories/account-recovery.repository';
import {loadEmailTemplate, queueEmail} from '../../providers/email.provider';
import {createRequest} from 'node-mocks-http';
import {EmailTemplate} from '../../types/template.type';
import {cfg} from '../../config/settings.config';
import {redisClose} from '../../config/init-redis.config';
import {routeLink} from '../../config/init-routes.config';
import {createFutureDate} from '../../helpers/date.helper';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../repositories/account-token.repository');
jest.mock('../../repositories/account-recovery.repository');
jest.mock('../../providers/email.provider');

const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    language: 'en',
};

afterAll(async () => {
    await redisClose();
});

describe('Account Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('encryptPassword', () => {
        it('should hash password correctly', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            const result = await accountService.encryptPassword('plainPassword');

            expect(result).toBe('hashedPassword');
            expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
        });
    });

    describe('verifyPassword', () => {
        it('should return true for valid password', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            const result = await accountService.verifyPassword('plainPassword', 'hashedPassword');

            expect(result).toBe(true);
        });
    });

    describe('createAuthToken', () => {
        it('should generate a JWT token', async () => {
            (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

            const result = accountService.createAuthToken(mockUser);

            expect(result).toHaveProperty('token', 'fakeToken');
            expect(result).toHaveProperty('ident');
            expect(result).toHaveProperty('expire_at');
        });
    });

    describe('setupToken', () => {
        it('should store the token in the repository', async () => {
            (jwt.sign as jest.Mock).mockReturnValue('fakeToken');
            (AccountTokenRepository.save as jest.Mock).mockResolvedValue(null);

            const mockRequest = createRequest({
                headers: {
                    'user-agent': 'Mozilla/5.0',
                    'accept-language': 'en-US,en;q=0.9',
                }
            });

            const token = await accountService.setupToken(mockUser, mockRequest);

            expect(token).toBe('fakeToken');
            expect(AccountTokenRepository.save).toHaveBeenCalled();
        });
    });

    describe('readToken', () => {
        it('should read the token from the request headers', () => {
            const token = 'jwt-token-123';

            const mockRequest = createRequest({
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            expect(accountService.readToken(mockRequest)).toBe(token);
        });

        it('should return undefined if no authorization header is present', () => {
            const mockRequest = createRequest({
                headers: {},
            });

            expect(accountService.readToken(mockRequest)).toBeUndefined();
        });
    });

    describe('setupRecovery', () => {
        it('should store recovery info', async () => {
            (AccountRecoveryRepository.save as jest.Mock).mockResolvedValue(null);

            const req = {headers: {'user-agent': 'Mozilla'}} as any;
            const [ident, expire_at] = await accountService.setupRecovery(mockUser, req);

            expect(ident).toBeDefined();
            expect(expire_at).toBeInstanceOf(Date);
            expect(AccountRecoveryRepository.save).toHaveBeenCalled();
        });
    });

    describe('createConfirmationToken', () => {
        it('should return token and expiry', async () => {
            (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

            const result = accountService.createConfirmationToken(mockUser);

            expect(result.token).toBe('fakeToken');
            expect(result.expire_at).toBeInstanceOf(Date);
        });
    });

    describe('sendEmailConfirmCreate', () => {
        it('should send an email confirmation for account creation', async () => {
            const token = 'jwt-token-123';
            const expire_at = createFutureDate(cfg('user.emailConfirmationExpiresIn') * 86400);
            const emailTemplate: EmailTemplate = {
                templateId: null,
                language: mockUser.language,
                emailContent: {
                    subject: 'Confirm Email',
                    html: 'Confirm your email',
                }
            };

            (jwt.sign as jest.Mock).mockReturnValue(token);
            (loadEmailTemplate as jest.Mock).mockResolvedValue(emailTemplate);

            await accountService.sendEmailConfirmCreate(mockUser);

            expect(loadEmailTemplate).toHaveBeenCalledWith('email-confirm-create', mockUser.language);
            expect(queueEmail).toHaveBeenCalledWith(
                emailTemplate,
                {
                    'name': mockUser.name,
                    'link': routeLink('account.emailConfirm', {token: token}, true),
                    'expire_at': expire_at.toISOString()
                },
                {
                    name: mockUser.name,
                    address: mockUser.email
                }
            );
        });
    });

    describe('sendEmailConfirmUpdate', () => {
        it('should send an email confirmation for email update', async () => {
            const token = 'jwt-token-123';
            const expire_at = createFutureDate(cfg('user.emailConfirmationExpiresIn') * 86400);
            const emailTemplate: EmailTemplate = {
                templateId: null,
                language: mockUser.language,
                emailContent: {
                    subject: 'Confirm Email Update',
                    html: 'Confirm your email update',
                }
            };

            (jwt.sign as jest.Mock).mockReturnValue(token);
            (loadEmailTemplate as jest.Mock).mockResolvedValue(emailTemplate);

            await accountService.sendEmailConfirmUpdate(mockUser);

            expect(loadEmailTemplate).toHaveBeenCalledWith('email-confirm-update', mockUser.language);
            expect(queueEmail).toHaveBeenCalledWith(
                emailTemplate,
                {
                    'name': mockUser.name,
                    'link': routeLink('account.emailConfirm', {token: token}, true),
                    'expire_at': expire_at.toISOString()
                },
                {
                    name: mockUser.name,
                    address: mockUser.email
                }
            );
        });
    });

    describe('sendWelcomeEmail', () => {
        it('should send a welcome email', async () => {
            const emailTemplate: EmailTemplate = {
                templateId: null,
                language: mockUser.language,
                emailContent: {
                    subject: 'Welcome',
                    html: 'Welcome to our service',
                }
            };

            (loadEmailTemplate as jest.Mock).mockResolvedValue(emailTemplate);

            await accountService.sendWelcomeEmail(mockUser);

            expect(loadEmailTemplate).toHaveBeenCalledWith('email-welcome', mockUser.language);
            expect(queueEmail).toHaveBeenCalledWith(
                emailTemplate,
                {
                    'name': mockUser.name
                },
                {
                    name: mockUser.name,
                    address: mockUser.email
                }
            );
        });
    });
});
