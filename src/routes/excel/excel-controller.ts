import { Request, Response } from 'express'
import ExcelService from './excel-service'

class ExcelController {
  private excelService: ExcelService

  constructor(excelService: ExcelService) {
    this.excelService = excelService
  }

  uploadXlsx = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    try {
      const result = await this.excelService.processXlsxFile(req.file.buffer)
      res.status(201).json(result)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}

export default ExcelController
