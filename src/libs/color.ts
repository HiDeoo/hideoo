import { colord } from 'colord'

export function getStatsChartColors(baseColor: string) {
  const color = colord(baseColor)

  return {
    backgroundColor: color.alpha(0.075).toRgbString(),
    borderColor: color.toRgbString(),
    legendColor: color.desaturate(0.2).alpha(0.65).toRgbString(),
  }
}

export function getLanguagesChartColors(baseColor: string) {
  const color = colord(baseColor)

  return {
    backgroundColor: color.alpha(0.075).toRgbString(),
    borderColor: color.toRgbString(),
    legendColor: color.desaturate(0.1).alpha(0.9).toRgbString(),
  }
}
