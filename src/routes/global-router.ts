import { Router } from 'express'
import authRouter from './auth/auth-router'
import excelRouter from './excel/excel-router'

const globalRouter = Router()

globalRouter.use('/auth', authRouter)
globalRouter.use('/excel', excelRouter)

export default globalRouter
