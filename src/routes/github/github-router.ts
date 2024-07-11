import { Router } from 'express'
import multer from 'multer'
import GithubController from './github-controller'

const githubRouter = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

const githubController = new GithubController()

githubRouter.post(
  '/upload',
  upload.single('excel'),
  githubController.uploadXlsx
)

export default githubRouter
