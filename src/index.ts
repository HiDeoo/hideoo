import dotenv from 'dotenv-flow'

import { getStatsChartData } from './libs/chart'
import { fetchGitHubStats } from './libs/github'
import { fetchNpmStats } from './libs/npm'
import { generateStatsChart } from './libs/svg'

dotenv.config()

async function run() {
  try {
    const gitHub = await fetchGitHubStats()
    const npm = await fetchNpmStats()

    const statsChartData = await getStatsChartData({ gitHub, npm })

    generateStatsChart(statsChartData)
  } catch (error) {
    console.error(error)

    process.exit(1)
  }
}

run()
