import dotenv from 'dotenv-flow'

import { fetchGitHubStats } from './libs/github'

dotenv.config()

async function run() {
  try {
    await fetchGitHubStats()
  } catch (error) {
    console.error(error)

    process.exit(1)
  }
}

run()
