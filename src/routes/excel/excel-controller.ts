import { Request, Response } from 'express'
import ExcelService from './excel-service'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

class ExcelController {
  private excelService: ExcelService

  constructor() {
    this.excelService = new ExcelService(GEMINI_API_KEY as string)
  }

  uploadXlsx = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    try {
      const result = await this.excelService.processXlsxFile(
        req.file.buffer,
        GEMINI_API_KEY as string
      )
      res.status(200).json(result)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}

export default ExcelController
