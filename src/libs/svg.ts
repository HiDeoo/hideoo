import fs from 'node:fs/promises'
import path from 'node:path'

import { CONFIG } from '../config'

import { type Stats } from './chart'

export async function generateStatsChart(stats: Stats, statsChartData: string) {
  return generateChart(CONFIG.charts.stats.fileName, {
    CHART_DATA: statsChartData,
    CHART_HEIGHT: String(CONFIG.charts.stats.height - CONFIG.charts.stats.wrapperBorder * 2),
    CHART_OFFSET: String(CONFIG.charts.stats.offset),
    CHART_WIDTH: String(
      CONFIG.charts.stats.width - CONFIG.charts.stats.legend.width - CONFIG.charts.stats.wrapperBorder * 2
    ),
    GITHUB_CONTRIBUTIONS: String(stats.gitHub.totalContributions),
    LEGEND_GITHUB_TITLE_COLOR: CONFIG.charts.stats.gitHub.backgroundColor,
    LEGEND_GITHUB_VALUE_COLOR: CONFIG.charts.stats.gitHub.borderColor,
    LEGEND_NPM_TITLE_COLOR: CONFIG.charts.stats.npm.backgroundColor,
    LEGEND_NPM_VALUE_COLOR: CONFIG.charts.stats.npm.borderColor,
    LEGEND_SEPARATOR_X: String(
      CONFIG.charts.stats.width -
        CONFIG.charts.stats.legend.width -
        CONFIG.charts.stats.wrapperBorder * 2 +
        CONFIG.charts.stats.offset -
        3
    ),
    LEGEND_X: String(
      CONFIG.charts.stats.width -
        CONFIG.charts.stats.legend.width -
        CONFIG.charts.stats.wrapperBorder * 2 +
        CONFIG.charts.stats.legend.margin +
        CONFIG.charts.stats.offset
    ),
    LEGEND_Y: String(CONFIG.charts.stats.wrapperBorder + CONFIG.charts.stats.legend.margin),
    NPM_DOWNLOADS: String(stats.npm.totalDownloads),
    SEPARATOR_COLOR: CONFIG.charts.separatorColor,
    VIEW_BOX_HEIGHT: String(CONFIG.charts.stats.height),
    VIEW_BOX_WIDTH: String(CONFIG.charts.stats.width),
    WRAPPER_HEIGHT: String(CONFIG.charts.stats.height - CONFIG.charts.stats.wrapperBorder),
    WRAPPER_WIDTH: String(CONFIG.charts.stats.width - CONFIG.charts.stats.wrapperBorder),
  })
}

async function generateChart(fileName: string, variables: Record<string, string>) {
  const template = await getSvgTemplate(path.join('templates', fileName))

  const compiledTemplate = template.replaceAll(/__(\w+)__/g, (_match, variable) => {
    const value = variables[variable]

    if (!value) {
      throw new Error(`Invalid template variable '${variable}'`)
    }

    return value
  })

  return fs.writeFile(path.join('assets', fileName), compiledTemplate)
}

function getSvgTemplate(templatePath: string) {
  return fs.readFile(templatePath, { encoding: 'utf8' })
}
