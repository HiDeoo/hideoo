import fs from 'node:fs/promises'
import path from 'node:path'

import { CONFIG, THEMES } from '../config'

import { getStatsChartData, type Stats } from './chart'

export async function generateStatsChart(stats: Stats) {
  const now = new Date()
  const numberFormatter = Intl.NumberFormat('en', { notation: 'compact' })

  for (const currentTheme of THEMES) {
    const theme = CONFIG.charts.colors[currentTheme]

    const statsChartData = await getStatsChartData(stats, theme)

    await generateChart(`${CONFIG.charts.stats.fileName}.svg`, `${CONFIG.charts.stats.fileName}-${currentTheme}.svg`, {
      CHART_DATA: statsChartData,
      CHART_HEIGHT: CONFIG.charts.stats.height - CONFIG.charts.stats.wrapperBorder * 2,
      CHART_OFFSET: CONFIG.charts.stats.offset,
      CHART_WIDTH: CONFIG.charts.stats.width - CONFIG.charts.stats.legend.width - CONFIG.charts.stats.wrapperBorder * 2,
      GITHUB_CONTRIBUTIONS: numberFormatter.format(stats.gitHub.totalContributions),
      LEGEND_GITHUB_TITLE_COLOR: theme.stats.gitHub.legendColor,
      LEGEND_GITHUB_VALUE_COLOR: theme.stats.gitHub.borderColor,
      LEGEND_NPM_TITLE_COLOR: theme.stats.npm.legendColor,
      LEGEND_NPM_VALUE_COLOR: theme.stats.npm.borderColor,
      LEGEND_SEPARATOR_X:
        CONFIG.charts.stats.width -
        CONFIG.charts.stats.legend.width -
        CONFIG.charts.stats.wrapperBorder * 2 +
        CONFIG.charts.stats.offset -
        3,
      LEGEND_X:
        CONFIG.charts.stats.width -
        CONFIG.charts.stats.legend.width -
        CONFIG.charts.stats.wrapperBorder * 2 +
        CONFIG.charts.stats.legend.margin.x +
        CONFIG.charts.stats.offset,
      LEGEND_Y: CONFIG.charts.stats.wrapperBorder + CONFIG.charts.stats.legend.margin.y,
      LEGEND_YEARS_COLOR: theme.stats.legend,
      NPM_DOWNLOADS: numberFormatter.format(stats.npm.totalDownloads),
      SEPARATOR_COLOR: theme.separator,
      VIEW_BOX_HEIGHT: CONFIG.charts.stats.height,
      VIEW_BOX_WIDTH: CONFIG.charts.stats.width,
      WRAPPER_HEIGHT: CONFIG.charts.stats.height - CONFIG.charts.stats.wrapperBorder,
      WRAPPER_WIDTH: CONFIG.charts.stats.width - CONFIG.charts.stats.wrapperBorder,
      YEARS: `${now.getFullYear() - 1}-${now.getFullYear()}`,
    })
  }
}

async function generateChart(templateName: string, fileName: string, variables: Record<string, string | number>) {
  const template = await getSvgTemplate(path.join('templates', templateName))

  const compiledTemplate = template.replaceAll(/__(\w+)__/g, (_match, variable) => {
    const value = variables[variable]

    if (!value) {
      throw new Error(`Invalid template variable '${variable}'`)
    }

    return value.toString()
  })

  return fs.writeFile(path.join('assets', fileName), compiledTemplate)
}

function getSvgTemplate(templatePath: string) {
  return fs.readFile(templatePath, { encoding: 'utf8' })
}
