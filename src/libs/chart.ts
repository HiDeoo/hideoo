import { type ChartDataset } from 'chart.js'
import { format } from 'date-fns'
import QuickChart from 'quickchart-js'

import { CONFIG } from '../config'

import { type GitHubStats } from './github'

export async function getStatsChartData({ gitHub }: Stats) {
  const chart = getNewChart(
    CONFIG.charts.stats.width - CONFIG.charts.stats.legend.width - CONFIG.charts.stats.wrapperBorder * 2,
    CONFIG.charts.stats.height - CONFIG.charts.stats.wrapperBorder * 2
  )

  chart.setConfig({
    data: {
      datasets: [
        {
          ...getNewDataSet(CONFIG.charts.stats.gitHub),
          data: gitHub.contributions.map((contribution) => contribution.count),
          fill: 'origin',
          yAxisID: 'yContributionAxis',
        },
        {
          ...getNewDataSet(CONFIG.charts.stats.npm),
          // FIXME(HiDeoo)
          data: gitHub.contributions.map((contribution) => contribution.count + 1000 + Math.floor(Math.random() * 500)),
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
            color: CONFIG.charts.tickColor,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        yContributionAxis: {
          grid: {
            color: CONFIG.charts.separatorColor,
            drawBorder: false,
            drawTicks: false,
          },
          position: 'left',
          stack: 'prout',
          ticks: {
            callback: (val, index) => {
              return index === 0 ? '' : val
            },
            color: CONFIG.charts.tickColor,
            count: CONFIG.charts.stats.yAxis.tickCount,
            labelOffset: CONFIG.charts.stats.yAxis.labelOffset,
            mirror: true,
            padding: 9,
          },
        },
        yDownloadAxis: {
          grid: {
            color: CONFIG.charts.separatorColor,
            drawBorder: false,
            drawTicks: false,
          },
          min: 0,
          position: 'right',
          stack: 'prout',
          ticks: {
            callback: (val, index) => {
              return index === 0 ? '' : val
            },
            color: CONFIG.charts.tickColor,
            count: CONFIG.charts.stats.yAxis.tickCount,
            labelOffset: CONFIG.charts.stats.yAxis.labelOffset,
            mirror: true,
            padding: -5,
          },
        },
      },
    },
    type: 'line',
  })

  return chart.toDataUrl()
}

function getNewChart(width: number, height: number) {
  const chart = new QuickChart()
  chart.setBackgroundColor(CONFIG.charts.backgroundColor)
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

interface Stats {
  gitHub: GitHubStats
}
