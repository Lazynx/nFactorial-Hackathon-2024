import { Router } from 'express'
import GitHubController from './github-controller'

const githubRouter = Router()

githubRouter.post('/check-repo', GitHubController.checkRepo)

export default githubRouter
