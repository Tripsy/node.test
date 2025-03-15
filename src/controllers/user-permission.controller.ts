import {Request, Response} from 'express';
import asyncHandler from '../helpers/async.handler';
import PermissionRepository from '../repositories/permission.repository';
import PermissionEntity from '../entities/permission.entity';
import PermissionCreateValidator from '../validators/permission-create.validator';
import PermissionUpdateValidator from '../validators/permission-update.validator';
import {lang} from '../config/i18n-setup.config';
import BadRequestError from '../exceptions/bad-request.error';
import CustomError from '../exceptions/custom.error';
import PermissionPolicy from '../policies/permission.policy';
import PermissionFindValidator from '../validators/permission-find.validator';

class UserPermissionController {
}

export default new UserPermissionController();
