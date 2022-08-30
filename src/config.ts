export const THEMES = ['dark', 'light'] as const

export const CONFIG = {
  charts: {
    colors: {
      dark: {
        background: 'transparent',
        separator: '#ff0fff',
        stats: {
          gitHub: {
            backgroundColor: 'rgba(64, 196, 99, 0.3)',
            borderColor: '#39d353',
          },
          legend: '#5000ff',
          npm: {
            backgroundColor: 'rgba(255, 196, 99, 0.3)',
            borderColor: '#ffd353',
          },
        },
        tick: '#009999',
      },
      light: {
        background: 'transparent',
        separator: '#ff0fff',
        stats: {
          gitHub: {
            backgroundColor: 'rgba(64, 196, 99, 0.3)',
            borderColor: '#39d353',
          },
          legend: '#5000ff',
          npm: {
            backgroundColor: 'rgba(255, 196, 99, 0.3)',
            borderColor: '#ffd353',
          },
        },
        tick: '#009999',
      },
    },
    devicePixelRatio: 1,
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
