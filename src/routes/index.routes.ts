import { Router, Request, Response } from 'express'
import {Repository} from 'typeorm'
import AppDataSource from '../config/data-source'
import User from '../entities/User'

const indexRoutes:  Router = Router()

indexRoutes.get('/', async function (req: Request, res: Response) {
    const userRepository: Repository<User> = AppDataSource.getRepository(User)

    // Example: Fetch all users
    const users = await userRepository.find();

    res.json(users)

    // res.send('Welcome to the API!');
})

export default indexRoutes
