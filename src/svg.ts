import fs from 'node:fs/promises'
import path from 'node:path'

import { CONFIG } from './config'

export async function generateStatsChart(statsChartData: string) {
  return generateChart(CONFIG.charts.stats.fileName, {
    CHART_DATA: statsChartData,
    HEIGHT: String(CONFIG.charts.stats.height),
    WIDTH: String(CONFIG.charts.stats.width),
  })
}

async function generateChart(fileName: string, variables: Record<string, string>) {
  const template = await getSvgTemplate(path.join('templates', fileName))

  const compiledTemplate = template.replaceAll(/\[\[(\w+)]]/g, (_match, variable) => {
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
