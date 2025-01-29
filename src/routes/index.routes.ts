import {Router, Request, Response} from 'express'
import userRepository from '../repositories/user.repository'
import User from '../entities/User'

const indexRoutes: Router = Router()

indexRoutes.get('/', async function (req: Request, res: Response) {
    // Example: Fetch all users
    const users: User[] = await userRepository.find()

    res.json(users)

    // res.send('Welcome to the API!');
})

export default indexRoutes
