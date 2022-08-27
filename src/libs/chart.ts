import fs from 'node:fs/promises'

import { format } from 'date-fns'
import QuickChart from 'quickchart-js'

import { type GitHubStats } from './github'

export async function generateStatsChart({ gitHub }: Stats) {
  const chart = await getNewChart()

  chart.setConfig({
    data: {
      datasets: [
        {
          backgroundColor: 'rgba(64, 196, 99, 0.3)',
          borderColor: '#39d353',
          borderWidth: 1,
          data: gitHub.contributions.map((contribution) => contribution.count),
          fill: 'origin',
          pointRadius: 0,
          tension: 0.275,
        },
        {
          backgroundColor: 'rgba(255, 0, 255, 0.3)',
          borderColor: '#ff00ff',
          borderWidth: 1,
          data: gitHub.contributions.map((contribution) => contribution.count + 100),
          fill: '-1',
          pointRadius: 0,
          tension: 0.275,
        },
      ],
      labels: gitHub.contributions.map((contribution) => format(new Date(contribution.date), 'yyyy-MM')),
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        xAxis: {
          ticks: {
            maxRotation: 0,
            maxTicksLimit: 7,
            minRotation: 0,
          },
        },
      },
    },
    type: 'line',
  })

  return chart.toFile('assets/chart.png')
}

async function getNewChart() {
  await ensureAssetsDirectory()

  const chart = new QuickChart()
  // TODO(HiDeoo)
  // chart.setBackgroundColor('transparent')
  chart.setDevicePixelRatio(2)
  chart.setVersion('3')

  return chart
}

function ensureAssetsDirectory() {
  return fs.mkdir('assets', { recursive: true })
}

interface Stats {
  gitHub: GitHubStats
}
