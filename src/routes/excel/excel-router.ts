import { Router } from 'express'
import multer from 'multer'
import ExcelController from './excel-controller'

const excelRouter = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

const excelController = new ExcelController()

excelRouter.post('/upload', upload.single('excel'), excelController.uploadXlsx)

export default excelRouter
