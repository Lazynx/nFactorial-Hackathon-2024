import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

const mission = `# Миссия, культура

## Миссия

Подготовить 10,000 высококлассных разработчиков и поставить Казахстан на технологическую карту мира, когда сотни миллионов людей по всему миру используют софтверные продукты “MADE IN КАЗАKHСТАН”.

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

export class GithubService {
  private readonly apiUrl: string = 'https://api.github.com/repos'
  private genAI: any

  constructor(geminiApiKey: string) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey)
  }

  async getRepositorySummary(owner: string, repo: string): Promise<object> {
    try {
      console.log('githubService is called with owner: ' + owner)
      const { data: repoData } = await axios.get(
        `${this.apiUrl}/${owner}/${repo}`,
        {
          headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
        }
      )

      let readmeData = ''
      try {
        const { data } = await axios.get(
          `${this.apiUrl}/${owner}/${repo}/readme`,
          {
            headers: {
              Accept: 'application/vnd.github.v3.raw',
              Authorization: `token ${process.env.GITHUB_TOKEN}`
            }
          }
        )
        readmeData = data
      } catch (error) {
        console.warn('README file not found for this repository.')
      }

      const { data: languagesData } = await axios.get(
        `${this.apiUrl}/${owner}/${repo}/languages`,
        {
          headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
        }
      )

      const stars = repoData.stargazers_count
      const watchers = repoData.watchers_count
      const forks = repoData.forks_count
      const about = repoData.description

      const geminiSummary = await this.analyzeWithGemini({
        readme: readmeData,
        languages: languagesData,
        stars,
        watchers,
        forks,
        about
      })

      return geminiSummary
    } catch (error) {
      console.log(error)
      if (axios.isAxiosError(error) && error.response) {
        const { status, statusText, data } = error.response
        throw new Error(
          `Error fetching repository data: ${status} ${statusText} - ${data.message}`
        )
      }
      throw new Error(`Error fetching repository data: ${error}`)
    }
  }

  private async analyzeWithGemini(data: any): Promise<any> {
    const promptText = `Analyze the following GitHub repository data and provide a response in JSON format with the following keys:
      "keyFeatures": "List of key features",
      "technologiesUsed": "List of technologies used",
      "installationAndUsage": "Installation and usage instructions",
      "summary": "Summary based on stars, watchers, forks, and about"
      \n${JSON.stringify(data)}`

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent([{ text: promptText }])
      const response = await result.response
      let messageContent = await response.text()
      console.log('Gemini response:', messageContent)

      // Remove code block markers and trim
      messageContent = messageContent.replace(/```json|```/g, '').trim()

      // Return the parsed JSON response
      return JSON.parse(messageContent)
    } catch (error) {
      console.error('Error from Gemini:', error)
      return {
        keyFeatures: 'Error extracting key features',
        technologiesUsed: 'Error extracting technologies used',
        installationAndUsage:
          'Error extracting installation and usage instructions',
        summary: 'Error extracting summary'
      }
    }
  }
}
