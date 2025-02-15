import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import UserRepository from '../repositories/user.repository';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import AccountLoginValidator from '../validators/account-login.validator';
import {UserStatusEnum} from '../enums/user-status.enum';
import NotFoundError from '../exceptions/not-found.error';
import UnauthorizedError from '../exceptions/unauthorized.error';
import {getActiveSessions, setupToken, verifyPassword} from '../services/account.service';
import {settings} from '../config/settings.config';

class AccountController {
    public login = asyncHandler(async (req: Request, res: Response) => {
        // Validate the request body against the schema
        const validated = AccountLoginValidator.safeParse(req.body);

        if (!validated.success) {
            res.output.errors(validated.error.errors);

            throw new BadRequestError();
        }

        const user = await UserRepository.createQuery()
            .select(['id', 'password', 'status'])
            .filterByEmail(validated.data.email)
            .firstOrFail();

        if (user.status !== UserStatusEnum.ACTIVE) {
            throw new NotFoundError(lang('account.error.not_active'));
        }

        const isValidPassword: boolean = await verifyPassword(validated.data.password, user.password);

        if (!isValidPassword) {
            throw new UnauthorizedError(lang('account.error.not_authorized'));
        }

        const activeSession: { id: number, label: string, used_at: Date }[] = await getActiveSessions(user.id);

        if (activeSession.length >= settings.user.maxActiveSessions) {
            res.status(403); // Forbidden - client's identity is known to the server
            res.output.message(lang('account.error.max_active_sessions'));
            res.output.data({
                'activeSession': activeSession
            });
        } else {
            const token = await setupToken(user, req);

            res.output.message(lang('account.success.login'));
            res.output.data({
                'token': token
            });
        }

        res.json(res.output);
    });

    public logout = asyncHandler(async (_req: Request, res: Response) => {

        // check entry in account_token
        // if found remove entry and return success message
        // if not found return error message

        res.output.message(lang('account.success.logout'));

        res.json(res.output);
    });

    // public passwordRecover = asyncHandler(async (_req: Request, res: Response) => {
    //     // Validate the request body against the schema
    //     const validated = AccountPasswordRecoverValidator.safeParse(req.body);
    //
    //     if (!validated.success) {
    //         res.output.errors(validated.error.errors);
    //
    //         throw new BadRequestError();
    //     }
    //
    //     // validate email address
    //     // check if user exists
    //     // check if user is active
    //     // Ensure rate limiting to prevent abuse - Rate limit password reset attempts per email/IP.
    //     // create password recovery token - based on JWT probably or UUID - with expiration time
    //     // save entry in account_password_recovery table [user_id, token, expires_at, used_at]
    //     // send password recovery email
    // });
    //
    // public passwordChange = asyncHandler(async (_req: Request, res: Response) => {
    //     // Validate the request body against the schema
    //     const validated = AccountPasswordChangeValidator.safeParse(req.body);
    //
    //     if (!validated.success) {
    //         res.output.errors(validated.error.errors);
    //
    //         throw new BadRequestError();
    //     }
    //
    //     // if authenticated user allow password change based on old password and new password
    //     // if not authenticated user allow password change based on password recovery token
    //
    //     // how do I remove entry from account_jwt_table if they are not authenticated
    //     // check against last password change date and compare with date of the issued token
    // });
}

export default new AccountController();
