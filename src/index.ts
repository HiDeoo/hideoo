import dotenv from 'dotenv-flow'

import { getStatsChartData, type Stats } from './libs/chart'
import { fetchGitHubStats } from './libs/github'
import { fetchNpmStats } from './libs/npm'
import { generateStatsChart } from './libs/svg'

dotenv.config()

async function run() {
  try {
    const gitHub = await fetchGitHubStats()
    const npm = await fetchNpmStats()

    const stats: Stats = { gitHub, npm }

    const statsChartData = await getStatsChartData(stats)

    generateStatsChart(stats, statsChartData)
  } catch (error) {
    console.error(error)

    process.exit(1)
  }
}

run()
