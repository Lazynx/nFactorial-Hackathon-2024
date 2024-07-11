import { Request, Response } from 'express'
import { GithubService } from './github-service'

const githubService = new GithubService(process.env.GEMINI_API_KEY as string)

class GitHubController {
  public static async checkRepo(req: Request, res: Response): Promise<void> {
    const { repoUrl } = req.body

    if (!repoUrl) {
      res.status(400).send({ error: 'repoUrl is required' })
      return
    }

    try {
      const [owner, repo] = GitHubController.extractOwnerAndRepo(repoUrl)
      const summary = await githubService.getRepositorySummary(owner, repo)
      res.status(200).send({ summary })
    } catch (error: any) {
      res.status(500).send({ error: error.message })
    }
  }

  private static extractOwnerAndRepo(repoUrl: string): [string, string] {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      throw new Error('Invalid GitHub repository URL')
    }
    return [match[1], match[2]]
  }
}

export default GitHubController
