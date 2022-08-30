import { type ChartDataset } from 'chart.js'
import { format } from 'date-fns'
import QuickChart from 'quickchart-js'

import { CONFIG, type Theme } from '../config'

import { type GitHubStats } from './github'
import { type NpmStats } from './npm'

export async function getStatsChartData({ gitHub, npm }: Stats, theme: Theme) {
  const chart = getNewChart(
    CONFIG.charts.stats.width - CONFIG.charts.stats.legend.width - CONFIG.charts.stats.wrapperBorder * 2,
    CONFIG.charts.stats.height - CONFIG.charts.stats.wrapperBorder * 2,
    theme.background
  )

  const gitHubContributions = gitHub.contributions.map((contribution) => contribution.count)
  const npmDownloads = npm.downloads.map((download) => download.count)

  chart.setConfig({
    data: {
      datasets: [
        {
          ...getNewDataSet(theme.stats.gitHub),
          data: gitHubContributions,
          fill: 'origin',
          yAxisID: 'yContributionAxis',
        },
        {
          ...getNewDataSet(theme.stats.npm),
          data: npmDownloads,
          fill: '-1',
          yAxisID: 'yDownloadAxis',
        },
      ],
      labels: gitHub.contributions.map((contribution, index) =>
        index % 2 !== 0 ? format(new Date(contribution.date), 'MMM yyyy') : ''
      ),
    },
    options: {
      layout: {
        padding: {
          bottom: 5,
          top: 5,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        xAxis: {
          grid: {
            display: false,
          },
          ticks: {
            autoSkip: false,
            color: theme.tick,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        yContributionAxis: {
          grid: {
            color: theme.separator,
            drawBorder: false,
            drawTicks: false,
          },
          min: 0,
          max: 1000,
          position: 'left',
          ticks: {
            callback: (val, index) => {
              return index === 0 ? '' : Intl.NumberFormat('en', { notation: 'compact' }).format(Number(val))
            },
            color: theme.tick,
            count: CONFIG.charts.stats.yAxis.tickCount,
            labelOffset: CONFIG.charts.stats.yAxis.labelOffset,
            mirror: true,
            padding: 9,
            precision: 0,
          },
        },
        yDownloadAxis: {
          grid: {
            color: theme.separator,
            drawBorder: false,
            drawTicks: false,
          },
          min: 0,
          position: 'right',
          ticks: {
            callback: (val, index) => {
              return index === 0 ? '' : Intl.NumberFormat('en', { notation: 'compact' }).format(Number(val))
            },
            color: theme.tick,
            count: CONFIG.charts.stats.yAxis.tickCount,
            labelOffset: CONFIG.charts.stats.yAxis.labelOffset,
            mirror: true,
            padding: -5,
            precision: 0,
          },
        },
      },
    },
    type: 'line',
  })

  return chart.toDataUrl()
}

function getNewChart(width: number, height: number, backgroundColor: string) {
  const chart = new QuickChart()
  chart.setBackgroundColor(backgroundColor)
  chart.setDevicePixelRatio(CONFIG.charts.devicePixelRatio)
  chart.setVersion('3')
  chart.setWidth(width)
  chart.setHeight(height)

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

export interface Stats {
  gitHub: GitHubStats
  npm: NpmStats
}
