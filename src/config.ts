export const THEMES = ['dark', 'light'] as const

export const CONFIG = {
  charts: {
    colors: {
      dark: {
        background: 'transparent',
        languages: {
          known: {
            CSS: '#8c63c9',
            Go: '#18c7f2',
            HTML: '#e34c26',
            JavaScript: '#f1e371',
            Lua: '#1d5fc6',
            Shell: '#26a641',
            Svelte: '#f2440c',
            TypeScript: '#1f6feb',
          },
          unknown: ['#6374ba', '#dea584', '#3d84bf', '#c6538c'],
        } as const,
        separator: '#30363d',
        stats: {
          gitHub: '#26a641',
          legend: '#8b949e',
          npm: '#1f6feb',
        },
        tick: '#8b949e',
      },
      light: {
        background: 'transparent',
        languages: {
          known: {
            CSS: '#7649b8',
            Go: '#02b5e0',
            HTML: '#d13711',
            JavaScript: '#c7b30f',
            Lua: '#0b4db5',
            Shell: '#30a14e',
            Svelte: '#e03700',
            TypeScript: '#0969da',
          },
          unknown: ['#4a5ca8', '#cc8b66', '#2871ad', '#b53c78'],
        } as const,
        separator: '#d0d7de',
        stats: {
          gitHub: '#30a14e',
          legend: '#57606a',
          npm: '#0969da',
        },
        tick: '#57606a',
      },
    },
    devicePixelRatio: 2,
    languages: {
      fileName: 'languages',
      height: 94,
      legend: {
        margin: {
          x: 14,
          y: 10,
        },
        width: 128,
      },
      limit: 5,
      offset: 10,
      width: 48,
      wrapperBorder: 1,
    },
    stats: {
      fileName: 'stats',
      height: 220,
      legend: {
        margin: {
          x: 14,
          y: 17,
        },
        width: 170,
      },
      offset: -20,
      width: 850,
      wrapperBorder: 1,
      yAxis: {
        labelOffset: 12,
        tickCount: 6,
      },
    },
    tension: 0.325,
  },
}

export type Theme = typeof CONFIG.charts.colors[typeof THEMES[number]]
