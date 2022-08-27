import dotenv from 'dotenv-flow'

import { generateStatsChart } from './libs/chart'
import { fetchGitHubStats } from './libs/github'

dotenv.config()

async function run() {
  try {
    const gitHubStats = await fetchGitHubStats()

    await generateStatsChart({ gitHub: gitHubStats })
  } catch (error) {
    console.error(error)

    process.exit(1)
  }
}

run()
