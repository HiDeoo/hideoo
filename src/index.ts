import dotenv from 'dotenv-flow'

import { getStatsChartData } from './libs/chart'
import { fetchGitHubStats } from './libs/github'
import { generateStatsChart } from './svg'

dotenv.config()

async function run() {
  try {
    const gitHubStats = await fetchGitHubStats()
    const gitHubStatsChartData = await getStatsChartData({ gitHub: gitHubStats })

    generateStatsChart(gitHubStatsChartData)
  } catch (error) {
    console.error(error)

    process.exit(1)
  }
}

run()
