import { read, utils } from 'xlsx'

class ExcelService {
  async processXlsxFile(fileBuffer: Buffer): Promise<any> {
    const workbook = read(fileBuffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = sheet ? utils.sheet_to_json(sheet, { header: 1 }) : []

    // Process the data as needed
    console.log('Parsed Excel data:', data)

    return data
  }
}

export default ExcelService
