import { Router } from 'express'
import authRouter from './auth/auth-router'
import excelRouter from './excel/excel-router'
import githubRouter from './github/github-router'

const globalRouter = Router()

globalRouter.use('/auth', authRouter)
globalRouter.use('/excel', excelRouter)
globalRouter.use('/github', githubRouter)

export default globalRouter
