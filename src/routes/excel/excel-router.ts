import { Router } from 'express'
import multer from 'multer'
import ExcelController from './excel-controller'
import ExcelService from './excel-service'

const excelRouter = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

const excelService = new ExcelService()
const excelController = new ExcelController(excelService)

excelRouter.post('/upload', upload.single('excel'), excelController.uploadXlsx)

export default excelRouter
