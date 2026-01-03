// // __tests__/unit/account.controller.test.ts
// import type { Request, Response } from 'express';
// import jwt from 'jsonwebtoken';
// import { UserStatusEnum } from '@/features/user/user.entity';
// import {  createAccountController } from '@/features/account/account.controller';
// import type {
//     IAccountService,
//     ConfirmationTokenPayload,
// } from '@/features/account/account.service';
// import type { IAccountValidator } from '@/features/account/account.validator';
// import type { IAccountEmailService } from '@/features/account/account-email.service';
// import type { IAccountRecoveryService } from '@/features/account/account-recovery.service';
// import type {
//     IAccountTokenService,
//     AuthValidToken,
// } from '@/features/account/account-token.service';
// import type { IUserService } from '@/features/user/user.service';
// import type PolicyAbstract from '@/lib/abstracts/policy.abstract';
//
// // Mock dependencies
// const mockPolicy = {
//     notAuth: jest.fn(),
//     requiredAuth: jest.fn(),
//     getId: jest.fn(),
// };
//
// const mockValidator = {
//     register: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     login: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     removeToken: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     passwordRecover: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     passwordRecoverChange: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     passwordUpdate: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     emailConfirmSend: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     emailUpdate: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     edit: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
//     delete: jest.fn(() => ({ validate: jest.fn(() => ({ isValid: true })) })),
// };
//
// const mockAccountService = {
//     register: jest.fn(),
//     checkPassword: jest.fn(() => Promise.resolve(true)),
//     updatePassword: jest.fn(),
//     processEmailConfirmCreate: jest.fn(),
//     createConfirmationToken: jest.fn(),
// };
//
// const mockAccountTokenService = {
//     getAuthValidTokens: jest.fn(),
//     setupAuthToken: jest.fn(),
//     removeAccountTokenByIdent: jest.fn(),
//     getActiveAuthToken: jest.fn(),
// };
//
// const mockAccountRecoveryService = {
//     countRecoveryAttempts: jest.fn(),
//     setupRecovery: jest.fn(),
//     findByIdent: jest.fn(),
//     update: jest.fn(),
// };
//
// const mockAccountEmailService = {
//     sendEmailPasswordRecover: jest.fn(),
//     sendEmailPasswordChange: jest.fn(),
//     sendEmailConfirmUpdate: jest.fn(),
// };
//
// const mockUserService = {
//     findByEmail: jest.fn(),
//     findById: jest.fn(),
//     update: jest.fn(),
//     delete: jest.fn(),
// };
//
// // Mock configuration
// jest.mock('@/config/settings.config', () => ({
//     cfg: jest.fn((key: string) => {
//         const configs: Record<string, any> = {
//             'user.maxActiveSessions': 5,
//             'user.recoveryAttemptsInLastSixHours': 3,
//             'user.recoveryEnableMetadataCheck': true,
//             'user.emailConfirmationSecret': 'test-secret',
//         };
//         return configs[key];
//     }),
// }));
//
// // Mock i18n
// jest.mock('@/config/i18n.setup', () => ({
//     lang: jest.fn((key: string) => key),
// }));
//
// // Mock helpers
// jest.mock('@/lib/helpers', () => ({
//     compareMetaDataValue: jest.fn(() => true),
//     createPastDate: jest.fn(() => new Date()),
//     tokenMetaData: jest.fn(() => ({ 'user-agent': 'test-agent' })),
// }));
//
// // Mock BaseController validate method
// const mockValidate = jest.fn((validator, data, res) => data);
//
// describe('AccountController - Happy Path Tests', () => {
//     let controller: AccountController;
//     let req: Partial<Request>;
//     let res: Partial<Response>;
//
//     beforeEach(() => {
//         jest.clearAllMocks();
//
//         controller = new AccountController(
//             mockPolicy as unknown as PolicyAbstract,
//             mockValidator as unknown as IAccountValidator,
//             mockAccountService as unknown as IAccountService,
//             mockAccountTokenService as unknown as IAccountTokenService,
//             mockAccountRecoveryService as unknown as IAccountRecoveryService,
//             mockAccountEmailService as unknown as IAccountEmailService,
//             mockUserService as unknown as IUserService,
//         );
//
//         // Mock the validate method
//         controller.validate = mockValidate;
//
//         req = {
//             body: {},
//             headers: {},
//         };
//
//         res = {
//             locals: {
//                 auth: null,
//                 lang: 'en',
//                 output: {
//                     data: jest.fn(function(this: any, data: any) {
//                         this.data = data;
//                         return this;
//                     }),
//                     message: jest.fn(function(this: any, message: string) {
//                         this.message = message;
//                         return this;
//                     }),
//                     errors: jest.fn(function(this: any, errors: any[]) {
//                         this.errors = errors;
//                         return this;
//                     }),
//                     data: undefined,
//                     message: undefined,
//                     errors: undefined,
//                 },
//                 validated: {},
//             },
//             json: jest.fn(),
//             status: jest.fn(() => res as Response),
//         };
//     });
//
//     describe('register', () => {
//         it('should successfully register a new user', async () => {
//             // Arrange
//             const registerData = {
//                 name: 'Test User',
//                 email: 'test@example.com',
//                 password: 'password123',
//                 language: 'en',
//             };
//
//             req.body = registerData;
//             const mockUser = { id: 1, ...registerData };
//             mockAccountService.register.mockResolvedValue(mockUser);
//
//             // Act
//             await controller.register(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.notAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.register(),
//                 registerData,
//                 res
//             );
//             expect(mockAccountService.register).toHaveBeenCalledWith(
//                 registerData,
//                 'en'
//             );
//             expect(res.locals.output.data).toBe(mockUser);
//             expect(res.locals.output.message).toBe('account.success.register');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('login', () => {
//         it('should successfully login with valid credentials', async () => {
//             // Arrange
//             const loginData = {
//                 email: 'test@example.com',
//                 password: 'password123',
//             };
//
//             req.body = loginData;
//             const mockUser = {
//                 id: 1,
//                 email: 'test@example.com',
//                 password: 'hashedpassword',
//                 status: UserStatusEnum.ACTIVE,
//             };
//
//             const mockToken = 'jwt-token';
//             const mockAuthTokens: AuthValidToken[] = [
//                 { id: 1, ident: 'token1', device_info: 'Device 1' },
//                 { id: 2, ident: 'token2', device_info: 'Device 2' },
//             ];
//
//             mockUserService.findByEmail.mockResolvedValue(mockUser);
//             mockAccountTokenService.getAuthValidTokens.mockResolvedValue(mockAuthTokens);
//             mockAccountTokenService.setupAuthToken.mockResolvedValue(mockToken);
//
//             // Act
//             await controller.login(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.notAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.login(),
//                 loginData,
//                 res
//             );
//             expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginData.email);
//             expect(mockAccountService.checkPassword).toHaveBeenCalledWith(
//                 loginData.password,
//                 mockUser.password
//             );
//             expect(mockAccountTokenService.getAuthValidTokens).toHaveBeenCalledWith(mockUser.id);
//             expect(mockAccountTokenService.setupAuthToken).toHaveBeenCalledWith(mockUser, req);
//             expect(res.locals.output.message).toBe('account.success.login');
//             expect(res.locals.output.data).toEqual({ token: mockToken });
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('removeToken', () => {
//         it('should successfully remove a token', async () => {
//             // Arrange
//             const tokenData = { ident: 'token-ident' };
//             req.body = tokenData;
//
//             // Act
//             await controller.removeToken(req as Request, res as Response);
//
//             // Assert
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.removeToken(),
//                 tokenData,
//                 res
//             );
//             expect(mockAccountTokenService.removeAccountTokenByIdent).toHaveBeenCalledWith(
//                 tokenData.ident
//             );
//             expect(res.locals.output.message).toBe('account.success.token_deleted');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('logout', () => {
//         it('should successfully logout and remove active token', async () => {
//             // Arrange
//             res.locals.auth = { id: 1 } as AuthUser;
//             const mockActiveToken = { ident: 'active-token' };
//             mockAccountTokenService.getActiveAuthToken.mockResolvedValue(mockActiveToken);
//
//             // Act
//             await controller.logout(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.requiredAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockAccountTokenService.getActiveAuthToken).toHaveBeenCalledWith(req);
//             expect(mockAccountTokenService.removeAccountTokenByIdent).toHaveBeenCalledWith(
//                 mockActiveToken.ident
//             );
//             expect(res.locals.output.message).toBe('account.success.logout');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('passwordRecover', () => {
//         it('should successfully initiate password recovery', async () => {
//             // Arrange
//             const recoveryData = { email: 'test@example.com' };
//             req.body = recoveryData;
//
//             const mockUser = {
//                 id: 1,
//                 name: 'Test User',
//                 email: 'test@example.com',
//                 language: 'en',
//                 status: UserStatusEnum.ACTIVE,
//             };
//
//             const mockRecoveryData = ['recovery-ident', new Date()];
//
//             mockUserService.findByEmail.mockResolvedValue(mockUser);
//             mockAccountRecoveryService.countRecoveryAttempts.mockResolvedValue(0);
//             mockAccountRecoveryService.setupRecovery.mockResolvedValue(mockRecoveryData);
//
//             // Act
//             await controller.passwordRecover(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.notAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.passwordRecover(),
//                 recoveryData,
//                 res
//             );
//             expect(mockUserService.findByEmail).toHaveBeenCalledWith(
//                 recoveryData.email,
//                 ['id', 'name', 'email', 'language', 'status']
//             );
//             expect(mockAccountRecoveryService.countRecoveryAttempts).toHaveBeenCalled();
//             expect(mockAccountRecoveryService.setupRecovery).toHaveBeenCalledWith(
//                 mockUser,
//                 expect.any(Object)
//             );
//             expect(mockAccountEmailService.sendEmailPasswordRecover).toHaveBeenCalledWith(
//                 { ...mockUser, language: 'en' },
//                 { ident: mockRecoveryData[0], expire_at: mockRecoveryData[1] }
//             );
//             expect(res.locals.output.message).toBe('account.success.password_recover');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('passwordRecoverChange', () => {
//         it('should successfully change password via recovery token', async () => {
//             // Arrange
//             const passwordData = { password: 'newpassword123' };
//             req.body = passwordData;
//
//             res.locals.validated = { ident: 'recovery-ident' };
//
//             const mockRecovery = {
//                 id: 1,
//                 user_id: 1,
//                 used_at: null,
//                 expire_at: new Date(Date.now() + 3600000), // 1 hour in future
//                 metadata: { 'user-agent': 'test-agent' },
//             };
//
//             const mockUser = {
//                 id: 1,
//                 email: 'test@example.com',
//                 language: 'en',
//                 status: UserStatusEnum.ACTIVE,
//             };
//
//             mockAccountRecoveryService.findByIdent.mockResolvedValue(mockRecovery);
//             mockUserService.findById.mockResolvedValue(mockUser);
//
//             // Act
//             await controller.passwordRecoverChange(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.notAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.passwordRecoverChange(),
//                 passwordData,
//                 res
//             );
//             expect(mockAccountRecoveryService.findByIdent).toHaveBeenCalledWith('recovery-ident');
//             expect(mockUserService.findById).toHaveBeenCalledWith(1, false);
//             expect(mockAccountService.updatePassword).toHaveBeenCalledWith(
//                 mockUser,
//                 passwordData.password
//             );
//             expect(mockAccountRecoveryService.update).toHaveBeenCalledWith({
//                 id: mockRecovery.id,
//                 used_at: expect.any(Date),
//             });
//             expect(mockAccountEmailService.sendEmailPasswordChange).toHaveBeenCalledWith({
//                 ...mockUser,
//                 language: 'en',
//             });
//             expect(res.locals.output.message).toBe('account.success.password_changed');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('passwordUpdate', () => {
//         it('should successfully update password when authenticated', async () => {
//             // Arrange
//             const passwordData = {
//                 password_current: 'oldpassword',
//                 password_new: 'newpassword123',
//             };
//
//             req.body = passwordData;
//             res.locals.auth = { id: 1 } as AuthUser;
//
//             const mockUser = {
//                 id: 1,
//                 email: 'test@example.com',
//                 password: 'hashed-old-password',
//             };
//
//             const mockToken = 'new-jwt-token';
//
//             mockPolicy.getId.mockReturnValue(1);
//             mockUserService.findById.mockResolvedValue(mockUser);
//             mockAccountTokenService.setupAuthToken.mockResolvedValue(mockToken);
//
//             // Act
//             await controller.passwordUpdate(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.requiredAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.passwordUpdate(),
//                 passwordData,
//                 res
//             );
//             expect(mockPolicy.getId).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockUserService.findById).toHaveBeenCalledWith(1, false);
//             expect(mockAccountService.checkPassword).toHaveBeenCalledWith(
//                 passwordData.password_current,
//                 mockUser.password
//             );
//             expect(mockAccountService.updatePassword).toHaveBeenCalledWith(
//                 mockUser,
//                 passwordData.password_new
//             );
//             expect(mockAccountTokenService.setupAuthToken).toHaveBeenCalledWith(
//                 mockUser,
//                 req
//             );
//             expect(res.locals.output.message).toBe('account.success.password_updated');
//             expect(res.locals.output.data).toEqual({ token: mockToken });
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('emailConfirm', () => {
//         it('should successfully confirm email for new registration', async () => {
//             // Arrange
//             const mockPayload: ConfirmationTokenPayload = {
//                 user_id: 1,
//                 user_email: 'test@example.com',
//             };
//
//             const mockUser = {
//                 id: 1,
//                 email: 'test@example.com',
//                 status: UserStatusEnum.PENDING,
//                 email_verified_at: null,
//             };
//
//             res.locals.validated = { token: 'encoded-jwt-token' };
//
//             // Mock jwt.verify
//             const mockVerify = jest.spyOn(jwt, 'verify').mockImplementation(() => mockPayload);
//             mockUserService.findById.mockResolvedValue(mockUser);
//
//             // Act
//             await controller.emailConfirm({} as Request, res as Response);
//
//             // Assert
//             expect(mockVerify).toHaveBeenCalledWith(
//                 'encoded-jwt-token',
//                 'test-secret'
//             );
//             expect(mockUserService.findById).toHaveBeenCalledWith(1, false);
//             expect(mockUserService.update).toHaveBeenCalledWith({
//                 id: 1,
//                 status: UserStatusEnum.ACTIVE,
//                 email_verified_at: expect.any(Date),
//             });
//             expect(res.locals.output.message).toBe('account.success.email_confirmed');
//             expect(res.json).toHaveBeenCalled();
//
//             mockVerify.mockRestore();
//         });
//
//         it('should successfully confirm email update', async () => {
//             // Arrange
//             const mockPayload: ConfirmationTokenPayload = {
//                 user_id: 1,
//                 user_email: 'old@example.com',
//                 user_email_new: 'new@example.com',
//             };
//
//             const mockUser = {
//                 id: 1,
//                 email: 'old@example.com',
//                 email_verified_at: null,
//             };
//
//             res.locals.validated = { token: 'encoded-jwt-token' };
//
//             // Mock jwt.verify
//             const mockVerify = jest.spyOn(jwt, 'verify').mockImplementation(() => mockPayload);
//             mockUserService.findById.mockResolvedValue(mockUser);
//
//             // Act
//             await controller.emailConfirm({} as Request, res as Response);
//
//             // Assert
//             expect(mockVerify).toHaveBeenCalledWith(
//                 'encoded-jwt-token',
//                 'test-secret'
//             );
//             expect(mockUserService.findById).toHaveBeenCalledWith(1, false);
//             expect(mockUserService.update).toHaveBeenCalledWith({
//                 id: 1,
//                 email: 'new@example.com',
//                 email_verified_at: expect.any(Date),
//             });
//             expect(res.locals.output.message).toBe('account.success.email_updated');
//
//             mockVerify.mockRestore();
//         });
//     });
//
//     describe('emailConfirmSend', () => {
//         it('should successfully resend confirmation email', async () => {
//             // Arrange
//             const emailData = { email: 'test@example.com' };
//             req.body = emailData;
//
//             const mockUser = {
//                 id: 1,
//                 name: 'Test User',
//                 email: 'test@example.com',
//                 language: 'en',
//                 status: UserStatusEnum.PENDING,
//             };
//
//             mockUserService.findByEmail.mockResolvedValue(mockUser);
//
//             // Act
//             await controller.emailConfirmSend(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.notAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.emailConfirmSend(),
//                 emailData,
//                 res
//             );
//             expect(mockUserService.findByEmail).toHaveBeenCalledWith(
//                 emailData.email,
//                 ['id', 'name', 'email', 'language', 'status']
//             );
//             expect(mockAccountService.processEmailConfirmCreate).toHaveBeenCalledWith(mockUser);
//             expect(res.locals.output.message).toBe('account.success.email_confirmation_sent');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('emailUpdate', () => {
//         it('should successfully initiate email update', async () => {
//             // Arrange
//             const emailData = { email_new: 'new@example.com' };
//             req.body = emailData;
//             res.locals.auth = { id: 1 } as AuthUser;
//
//             const mockUser = {
//                 id: 1,
//                 name: 'Test User',
//                 email: 'old@example.com',
//                 language: 'en',
//             };
//
//             const mockTokenData = {
//                 token: 'confirmation-token',
//                 expire_at: new Date(),
//             };
//
//             mockPolicy.getId.mockReturnValue(1);
//             mockUserService.findByEmail.mockResolvedValue(null); // No existing user with new email
//             mockUserService.findById.mockResolvedValue(mockUser);
//             mockAccountService.createConfirmationToken.mockReturnValue(mockTokenData);
//
//             // Act
//             await controller.emailUpdate(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.requiredAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.emailUpdate(),
//                 emailData,
//                 res
//             );
//             expect(mockUserService.findByEmail).toHaveBeenCalledWith(emailData.email_new);
//             expect(mockPolicy.getId).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockUserService.findById).toHaveBeenCalledWith(1, false);
//             expect(mockAccountService.createConfirmationToken).toHaveBeenCalledWith(
//                 mockUser,
//                 emailData.email_new
//             );
//             expect(mockAccountEmailService.sendEmailConfirmUpdate).toHaveBeenCalledWith(
//                 mockUser,
//                 mockTokenData.token,
//                 mockTokenData.expire_at,
//                 emailData.email_new
//             );
//             expect(res.locals.output.message).toBe('account.success.email_update_request');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('me', () => {
//         it('should return current authenticated user data', async () => {
//             // Arrange
//             const mockAuthUser = {
//                 id: 1,
//                 name: 'Test User',
//                 email: 'test@example.com',
//             };
//
//             res.locals.auth = mockAuthUser as AuthUser;
//
//             // Act
//             await controller.me({} as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.requiredAuth).toHaveBeenCalledWith(mockAuthUser);
//             expect(res.locals.output.data).toBe(mockAuthUser);
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('sessions', () => {
//         it('should return list of active sessions', async () => {
//             // Arrange
//             const mockAuthUser = {
//                 id: 1,
//                 name: 'Test User',
//                 activeToken: 'current-token',
//             };
//
//             res.locals.auth = mockAuthUser as AuthUser;
//
//             const mockTokens: AuthValidToken[] = [
//                 { id: 1, ident: 'token1', device_info: 'Device 1', created_at: new Date() },
//                 { id: 2, ident: 'current-token', device_info: 'Current Device', created_at: new Date() },
//                 { id: 3, ident: 'token3', device_info: 'Device 3', created_at: new Date() },
//             ];
//
//             mockPolicy.getId.mockReturnValue(1);
//             mockAccountTokenService.getAuthValidTokens.mockResolvedValue(mockTokens);
//
//             // Act
//             await controller.sessions({} as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.requiredAuth).toHaveBeenCalledWith(mockAuthUser);
//             expect(mockPolicy.getId).toHaveBeenCalledWith(mockAuthUser);
//             expect(mockAccountTokenService.getAuthValidTokens).toHaveBeenCalledWith(1);
//
//             const expectedResponse = mockTokens.map(token => ({
//                 ...token,
//                 used_now: token.ident === 'current-token',
//             }));
//
//             expect(res.locals.output.data).toEqual(expectedResponse);
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('edit', () => {
//         it('should successfully update user profile', async () => {
//             // Arrange
//             const editData = {
//                 name: 'Updated Name',
//                 language: 'fr',
//             };
//
//             req.body = editData;
//             res.locals.auth = { id: 1 } as AuthUser;
//
//             const mockUser = {
//                 id: 1,
//                 name: 'Old Name',
//                 email: 'test@example.com',
//             };
//
//             mockPolicy.getId.mockReturnValue(1);
//             mockUserService.findById.mockResolvedValue(mockUser);
//
//             // Act
//             await controller.edit(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.requiredAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.edit(),
//                 editData,
//                 res
//             );
//             expect(mockPolicy.getId).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockUserService.findById).toHaveBeenCalledWith(1, false);
//             expect(mockUserService.update).toHaveBeenCalledWith({
//                 id: 1,
//                 name: editData.name,
//                 language: editData.language,
//             });
//             expect(res.locals.output.message).toBe('account.success.edit');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('delete', () => {
//         it('should successfully delete user account', async () => {
//             // Arrange
//             const deleteData = {
//                 password_current: 'password123',
//             };
//
//             req.body = deleteData;
//             res.locals.auth = { id: 1 } as AuthUser;
//
//             const mockUser = {
//                 id: 1,
//                 name: 'Test User',
//                 email: 'test@example.com',
//                 password: 'hashedpassword',
//             };
//
//             mockPolicy.getId.mockReturnValue(1);
//             mockUserService.findById.mockResolvedValue(mockUser);
//
//             // Act
//             await controller.delete(req as Request, res as Response);
//
//             // Assert
//             expect(mockPolicy.requiredAuth).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockValidate).toHaveBeenCalledWith(
//                 mockValidator.delete(),
//                 deleteData,
//                 res
//             );
//             expect(mockPolicy.getId).toHaveBeenCalledWith(res.locals.auth);
//             expect(mockUserService.findById).toHaveBeenCalledWith(1, false);
//             expect(mockAccountService.checkPassword).toHaveBeenCalledWith(
//                 deleteData.password_current,
//                 mockUser.password
//             );
//             expect(mockUserService.delete).toHaveBeenCalledWith(1);
//             expect(res.locals.output.message).toBe('account.success.delete');
//             expect(res.json).toHaveBeenCalled();
//         });
//     });
//
//     describe('createAccountController factory', () => {
//         it('should create controller with dependencies', () => {
//             // Arrange
//             const deps = {
//                 policy: mockPolicy as unknown as PolicyAbstract,
//                 validator: mockValidator as unknown as IAccountValidator,
//                 accountService: mockAccountService as unknown as IAccountService,
//                 accountTokenService: mockAccountTokenService as unknown as IAccountTokenService,
//                 accountRecoveryService: mockAccountRecoveryService as unknown as IAccountRecoveryService,
//                 accountEmailService: mockAccountEmailService as unknown as IAccountEmailService,
//                 userService: mockUserService as unknown as IUserService,
//             };
//
//             // Act
//             const controller = createAccountController(deps);
//
//             // Assert
//             expect(controller).toBeInstanceOf(AccountController);
//         });
//     });
// });