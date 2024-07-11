import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
