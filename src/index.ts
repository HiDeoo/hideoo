import dotenv from 'dotenv-flow'

import { fetchGitHubStats } from './libs/github'
import { fetchNpmStats } from './libs/npm'
import { generateStatsChart } from './libs/svg'

dotenv.config()

async function run() {
  try {
    const gitHub = await fetchGitHubStats()
    const npm = await fetchNpmStats()

    await generateStatsChart({ gitHub, npm })
  } catch (error) {
    console.error(error)

    process.exit(1)
  }
}

run()
