import { read, utils } from 'xlsx'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'

class ExcelService {
  private genAI: any

  constructor(geminiApiKey: string) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey)
  }

  async processXlsxFile(
    fileBuffer: Buffer,
    geminiApiKey: string
  ): Promise<any> {
    const workbook = read(fileBuffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data: any[][] = sheet ? utils.sheet_to_json(sheet, { header: 1 }) : []

    // Ensure headers are treated as an array of strings
    const headers: string[] = data[0] as string[]
    const rows = data.slice(1)

    // Create JSON output
    const jsonOutput = rows.map((row: any[]) => {
      const jsonObj: { [key: string]: any } = {}
      headers.forEach((header: string, index: number) => {
        jsonObj[header] = row[index] || ''
      })
      return jsonObj
    })

    // Filter and limit output to the first 10 records
    const filteredOutput = jsonOutput
      .filter((item: { [key: string]: any }) => {
        return (
          item[
            'Можете ли Вы находиться в Алматы на время инкубатора (5 июня - 9 августа 2024г)?'
          ] !== false
        )
      })
      .slice(0, 10)

    console.log('Filtered Excel data:', filteredOutput)

    const responses: string[] = []
    for (const item of filteredOutput) {
      const response = await this.sendToGemini(item)
      responses.push(response)
      await this.delay(1000) // Delay of 1 second between requests
    }

    // Add responses to the filtered output
    const responseData = filteredOutput.map((item, index) => {
      return { ...item, 'Gemini Response': responses[index] }
    })

    console.log('Response data:', responseData)
    return responseData
  }

  private async sendToGemini(data: any): Promise<string> {
    const promptText = `Please analyze the following user data and decide whether the participant should be accepted into the programming school. give me short answer. Be not strict in your evaluation: 
    ${JSON.stringify(data)}`

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent([{ text: promptText }])
      const response = await result.response
      const text = await response.text()
      console.log('Gemini response:', text)

      return text || 'No content received from Gemini'
    } catch (error) {
      console.error('Error from Gemini:', error)
      return 'Error receiving response from Gemini'
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export default ExcelService
