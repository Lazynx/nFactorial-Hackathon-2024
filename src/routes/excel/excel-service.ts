import { read, utils } from 'xlsx'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'

const mission = `# Миссия, культура

      ## Миссия

      Подготовить 10,000 высококлассных разработчиков и поставить Казахстан на технологическую карту мира, когда сотни миллионов людей по всему миру используют софтверные продукты “MADE IN KAZAKHSTAN”.

      Train 10,000 high-class software engineers and build software used by millions around the globe. 

      ## Ценности

      1. Получать удовольствие
      2. Распространять эмпатию 
      3. Создавать ценность
      4. Творить историю

      1. Have fun 
      2. Spread empathy 
      3. Generate value 
      4. Make history

      ## Культура (студенты)

      1. Have fun
          1. Получайте удовольствие
      2. Not knowing something is okay
          1. Что-то не знать это окей
      3. Not understanding something is okay
          1. Что-то не понимать это окей
      4. Not “performing” is okay
          1. Что-то не успевать это окей
      5. Be mentor yourself, help your peers
          1. Будь ментором, помогай другим
      6. Help someone
          1. Помоги кому-нибудь
      7. Be open
          1. Оставайся открытым
      8. Just google it
          1. Просто загугли
      9. Listen, Learn, Repeat
          1. Слушай, Запоминай, Повторяй
      10. Always Be Coding
          1. Всегда Пиши Код
      11. First try to google, then ask for help
          1. Сначала попробуй загуглить, потом проси помощи
      12. Learn what not to ask
          1. Научись понимать какие вопросы не задавать
      13. Done is better than perfect 
          1. Сделано лучше, чем идеально
      14. Release something today
          1. Зарелизь что-нибудь сегодня
      15. Release early, ship often
          1. Релизь пораньше, обновляй почаще
      16. Don’t waste time solving problems you don’t yet have
          1. Не тратьте время решая проблемы, которых у вас еще нет
      17. Stay creative
          1. Будьте креативными
      18. Always ask yourself “What problem am I solving?”
          1. Всегда спрашивай себя “Какую проблему решаю?”
      19. Always be curious
          1. Будьте любознательны
      20. Get things to the finish line
          1. Доводите начатое до конца
      21. Don’t forget to invent 
          1. Не забывайте изобретать
      22. Think big
          1. Думайте масштабно
      23. Have a bias for action
          1. Делать > Говорить
          дайте короткий ответ.
    `

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
      .slice(15, 30)

    console.log('Filtered Excel data:', filteredOutput)

    const responses: string[] = []
    for (const item of filteredOutput) {
      const response = await this.sendToGemini(item)
      responses.push(response)
      await this.delay(1000) // Delay of 1 second between requests
    }

    // Add responses and normalize GitHub URLs to the filtered output
    const responseData = filteredOutput.map((item, index) => {
      const githubUrl = this.normalizeGitHubUrl(item['Ссылка на GitHub'])
      return {
        ...item,
        'Gemini Response': responses[index],
        'Normalized GitHub URL': githubUrl
      }
    })

    console.log('Response data:', responseData)
    return responseData
  }

  private normalizeGitHubUrl(url: string): string {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `https://github.com/${url}`
  }

  private async sendToGemini(data: any): Promise<string> {
    const promptText = `Проанализируйте следующие данные пользователя и решите, стоит ли принимать участника в стартап AI инкубатор из Казахстана который находится в Алмате.
    Наша компания ищет уже людей которые имеют хороший опыт в создание веб-проектов и нуждается в людях которые имеют опыт с веб-фреймворками 
    Наша компания называется Nfactorial и каждое лето мы делаем инкубатор в Сатпаевском Университете
    
    наша миссия:
    ${mission}
    у тебя три выбора: принять, отказать, на рассмотрение ментору(whitelist) вот что они значат:

    если есть проблемы не в понимании каких либо аспектов, что от тебя должно быть редким, так как твоя задача облгечить работу менторов ты можешь отправить на рассмотр заявки ментору для этого просто напиши вначале whitelist и причину почему он был whitelist-нут
    люди которые не знают веб-разработку не входят в whitelist, им сразу приходит отказ это очень важный аспект, так что пожалуйста придерживайся его

    желательно брать людей у которых уже есть опыт в программирование вебсайтов (уже использовал какие либо веб-фреймворки будто бэкенд или фронтенд) отвечай нам да если это так. Если есть опыт с вебфреймворками отвечай Да!!
    
    если человек не знает веб-фреймворки и знает только языки программирования и не относящие к веб разработке библиотеки или фреймворки отвечай нет
    отвечай мне с причинами почему да или почему нет коротко, если нету опыта с веб-фреймворками отвечай Нет и после этого причину.
    новичков которые только учатся мы тоже не берем это отказ, это тоже считается важным аспектом нашего поиска, и не знание ни одного веб фреймворка тоже является отказом это тоже оочень важно

    ОТКАЗЫВАТЬ ВСЕМ У КОГО НЕТУ НИЧЕГО ПРО ВЕБ-РАЗРАБОТКУ!
    ${JSON.stringify(data)}
    `

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