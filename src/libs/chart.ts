import { type ChartDataset } from 'chart.js'
import { endOfMonth, format, isSameDay, startOfMonth } from 'date-fns'
import QuickChart from 'quickchart-js'

import { CONFIG, type Theme } from '../config'

import { getLanguagesChartColors, getStatsChartColors } from './color'
import { type GitHubLanguages, type GitHubContributions } from './github'
import { type NpmYearDownloads } from './npm'

export async function getStatsChartData({ gitHub, npm }: Stats, theme: Theme) {
  const chart = getNewChart(
    CONFIG.charts.stats.width - CONFIG.charts.stats.legend.width - CONFIG.charts.stats.wrapperBorder * 2,
    CONFIG.charts.stats.height - CONFIG.charts.stats.wrapperBorder * 2,
    theme.background
  )

  let gitHubContributions = gitHub.all.map((contribution) => contribution.count)
  let npmDownloads = npm.all.map((download) => download.count)

  const today = new Date()
  const estimateStart = startOfMonth(today)
  const estimateEnd = endOfMonth(today)

  const shouldAddEstimates = !isSameDay(today, estimateEnd)

  if (shouldAddEstimates) {
    const estimateRatio = clampRatio(
      (today.getTime() - estimateStart.getTime()) / (estimateEnd.getTime() - estimateStart.getTime())
    )

    gitHubContributions = [...gitHubContributions.slice(0, -1), gitHubContributions.at(-1)! / estimateRatio]
    npmDownloads = [...npmDownloads.slice(0, -1), npmDownloads.at(-1)! / estimateRatio]
  }

  chart.setConfig({
    data: {
      datasets: [
        {
          ...getNewDataSet(getStatsChartColors(theme.stats.gitHub), shouldAddEstimates),
          data: gitHubContributions,
          fill: 'origin',
          yAxisID: 'yContributionAxis',
        },
        {
          ...getNewDataSet(getStatsChartColors(theme.stats.npm), shouldAddEstimates),
          data: npmDownloads,
          fill: '-1',
          yAxisID: 'yDownloadAxis',
        },
      ],
      labels: gitHub.all.map((contribution, index) =>
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

export async function getLanguagesChartData(languages: GitHubLanguages, theme: Theme) {
  const chart = getNewChart(
    CONFIG.charts.languages.width - CONFIG.charts.stats.wrapperBorder * 2,
    CONFIG.charts.languages.height - CONFIG.charts.stats.wrapperBorder * 2,
    theme.background
  )

  const distribution = languages.map((language) => language[1])
  const { backgroundColor, borderColor, legendColor } = getLanguagesColors(languages, theme)

  chart.setConfig({
    data: {
      datasets: [
        {
          ...getNewDataSet(),
          backgroundColor,
          borderColor,
          circumference: 180,
          data: distribution,
        },
      ],
      labels: languages.map((language) => language),
    },
    options: {
      plugins: {
        datalabels: {
          display: false,
        },
        legend: {
          display: false,
        },
      },
    },
    type: 'doughnut',
  })

  const data = await chart.toDataUrl()

  return { data, legendColor }
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

function getNewDataSet(options: Partial<ChartDataset> = {}, withEstimate = false): Partial<ChartDataset> {
  return {
    borderWidth: 1,
    pointRadius: 0,
    tension: CONFIG.charts.tension,
    segment: withEstimate ? { borderDash: (ctx) => (ctx.p1DataIndex === 12 ? [5, 5] : undefined) } : {},
    ...options,
  }
}

function isKnownLanguage(name: string, theme: Theme): name is keyof typeof theme.languages.known {
  return name in theme.languages.known
}

function getLanguagesColors(languages: GitHubLanguages, theme: Theme) {
  const colors: LanguagesColors = { backgroundColor: [], borderColor: [], legendColor: [] }
  let unknownColorsCount = 0

  for (const [name] of languages) {
    let baseColor: string

    if (isKnownLanguage(name, theme)) {
      baseColor = theme.languages.known[name]
    } else {
      const unknownBaseColor = theme.languages.unknown[unknownColorsCount]

      if (!unknownBaseColor) {
        throw new Error(`Missing color (or fallback color) for unknown language '${name}'.`)
      }

      baseColor = unknownBaseColor
      unknownColorsCount++
    }

    const { backgroundColor, borderColor, legendColor } = getLanguagesChartColors(baseColor)

    colors.backgroundColor.push(backgroundColor)
    colors.borderColor.push(borderColor)
    colors.legendColor.push(legendColor)
  }

  return colors
}

function clampRatio(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export interface Stats {
  gitHub: GitHubContributions
  npm: NpmYearDownloads
}

interface LanguagesColors {
  backgroundColor: string[]
  borderColor: string[]
  legendColor: string[]
}
