// class UserPolicy {
//     static create(req: Request): boolean {
//         // Example: Only admins can create users
//         return req.user?.role === 'admin';
//     }
//
//     static update(req: Request, user: UserEntity): boolean {
//         // Users can only update their own profiles, unless they're an admin
//         return req.user?.id === user.id || req.user?.role === 'admin';
//     }
//
//     static delete(req: Request, user: UserEntity): boolean {
//         // Only admins can delete users
//         return req.user?.role === 'admin';
//     }
//
//     static view(req: Request, user: UserEntity): boolean {
//         // Users can view their own profile or if they are admin
//         return req.user?.id === user.id || req.user?.role === 'admin';
//     }
// }
//
//
// export const Create = asyncHandler(async (req: Request, res: Response) => {
// // Check if the user is authorized to create a new user
//     if (!UserPolicy.create(req)) {
//         res.status(403); // Forbidden
//         res.output.message(lang('user.error.unauthorized'));
//         return res.json(res.output);
//     }