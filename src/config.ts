export const THEMES = ['dark', 'light'] as const

export const CONFIG = {
  charts: {
    colors: {
      dark: {
        background: 'transparent',
        separator: '#30363d',
        stats: {
          gitHub: {
            backgroundColor: 'rgba(38, 166, 65, 0.05)',
            borderColor: '#26a641',
            legendColor: 'rgba(71, 166, 91, 0.65)',
          },
          legend: '#8b949e',
          npm: {
            backgroundColor: 'rgba(31, 111, 235, 0.05)',
            borderColor: '#1f6feb',
            legendColor: 'rgba(78, 139, 235, 0.65)',
          },
        },
        tick: '#8b949e',
      },
      light: {
        background: 'transparent',
        separator: '#d0d7de',
        stats: {
          gitHub: {
            backgroundColor: 'rgba(48, 161, 78, 0.05)',
            borderColor: '#30a14e',
            legendColor: 'rgba(81, 161, 102, 0.65)',
          },
          legend: '#57606a',
          npm: {
            backgroundColor: 'rgba(9, 105, 218, 0.05)',
            borderColor: '#0969da',
            legendColor: 'rgba(52, 128, 218, 0.65)',
          },
        },
        tick: '#57606a',
      },
    },
    devicePixelRatio: 2,
    stats: {
      fileName: 'stats',
      height: 220,
      legend: {
        margin: {
          x: 14,
          y: 18,
        },
        width: 180,
      },
      offset: -20,
      width: 850,
      wrapperBorder: 1,
      yAxis: {
        labelOffset: 12,
        tickCount: 6,
      },
    },
    tension: 0.275,
  },
}

export type Theme = typeof CONFIG.charts.colors[typeof THEMES[number]]
