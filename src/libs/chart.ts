import { type ChartDataset } from 'chart.js'
import { format } from 'date-fns'
import QuickChart from 'quickchart-js'

import { CONFIG } from '../config'

import { type GitHubStats } from './github'

export async function getStatsChartData({ gitHub }: Stats) {
  const chart = getNewChart(CONFIG.charts.stats.width)

  chart.setConfig({
    data: {
      datasets: [
        {
          ...getNewDataSet(CONFIG.charts.stats.gitHub),
          data: gitHub.contributions.map((contribution) => contribution.count),
          fill: 'origin',
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

  return chart.toDataUrl()
}

function getNewChart(width: number) {
  const chart = new QuickChart()
  // TODO(HiDeoo)
  // chart.setBackgroundColor(CONFIG.charts.backgroundColor)
  chart.setDevicePixelRatio(CONFIG.charts.devicePixelRatio)
  chart.setVersion('3')
  chart.setWidth(width)

  return chart
}

function getNewDataSet(options: Partial<ChartDataset> = {}) {
  return {
    borderWidth: 1,
    pointRadius: 0,
    tension: CONFIG.charts.tension,
    ...options,
  }
}

interface Stats {
  gitHub: GitHubStats
}
