import { CONFIG } from '../config'

import { compileTemplate } from './template'

export function generateReadme() {
  return compileTemplate(
    'README.md',
    'README.md',
    {
      LANGUAGE_CHART_MAX_WIDTH:
        CONFIG.charts.languages.width +
        CONFIG.charts.languages.legend.width +
        CONFIG.charts.languages.legend.margin.x +
        CONFIG.charts.languages.wrapperBorder * 2,
    },
    '.'
  )
}
