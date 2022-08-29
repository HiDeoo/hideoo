import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import fetch from 'node-fetch'

const periodFormat = 'yyyy-MM-dd'

export async function fetchNpmStats(): Promise<NpmStats> {
  // FIXME(HiDeoo)
  // return Promise.resolve({
  //   downloads: [
  //     { count: 54_401, date: new Date('2022-08-01T00:00:00.000Z') },
  //     { count: 53_112, date: new Date('2022-07-01T00:00:00.000Z') },
  //     { count: 50_070, date: new Date('2022-06-01T00:00:00.000Z') },
  //     { count: 47_640, date: new Date('2022-05-01T00:00:00.000Z') },
  //     { count: 43_722, date: new Date('2022-04-01T00:00:00.000Z') },
  //     { count: 45_987, date: new Date('2022-03-01T00:00:00.000Z') },
  //     { count: 37_553, date: new Date('2022-02-01T00:00:00.000Z') },
  //     { count: 34_544, date: new Date('2022-01-01T00:00:00.000Z') },
  //     { count: 29_528, date: new Date('2021-12-01T00:00:00.000Z') },
  //     { count: 29_764, date: new Date('2021-11-01T00:00:00.000Z') },
  //     { count: 26_378, date: new Date('2021-10-01T00:00:00.000Z') },
  //     { count: 28_515, date: new Date('2021-09-01T00:00:00.000Z') },
  //     { count: 25_515, date: new Date('2021-08-01T00:00:00.000Z') },
  //   ].reverse(),
  // })

  const pkgs = await fetchPackages(process.env.NPM_LOGIN)
  const downloads = await fetchPackagesDownloads(pkgs)

  return { downloads }
}

async function fetchPackages(author: string): Promise<string[]> {
  const url = new URL('https://registry.npmjs.org/-/v1/search')
  url.search = new URLSearchParams({ size: '250', text: `maintainer:${author}` }).toString()

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const json = (await response.json()) as { objects: NpmSearchResult[] }

  return json.objects.map((searchResult) => {
    return searchResult.package.name
  })
}

async function fetchPackagesDownloads(pkgs: string[]): Promise<NpmStats['downloads']> {
  const downloads: Record<string, number> = {}

  const periods = getLastYearPeriods()

  for (const { start, end, date } of periods) {
    for (const pkg of pkgs) {
      const range = `${start}:${end}`

      console.info(`Fetching npm downloads for '${pkg}' (range: ${range})`)

      const response = await fetch(`https://api.npmjs.org/downloads/point/${range}/${pkg}`)

      if (!response.ok) {
        throw new Error(
          `${response.status}: ${response.statusText} while fetching npm downloads for '${pkg}' (range: ${range}).`
        )
      }

      const json = (await response.json()) as { downloads: number }

      if (downloads[date]) {
        downloads[date] += json.downloads
      } else {
        downloads[date] = json.downloads
      }
    }
  }

  return Object.entries(downloads)
    .map(([date, count]) => ({ count, date: new Date(date) }))
    .reverse()
}

function getLastYearPeriods() {
  const periods: Period[] = []

  function addPeriod(startDate: Date, endDate: Date) {
    periods.push({
      date: format(new Date(startDate), 'yyyy-MM'),
      start: format(startDate, periodFormat),
      end: format(endDate, periodFormat),
    })
  }

  const now = new Date()

  let end = now
  let start = startOfMonth(now)

  addPeriod(start, end)

  for (let i = 1; i <= 12; i++) {
    start = subMonths(start, 1)
    end = endOfMonth(start)

    addPeriod(start, end)
  }

  return periods
}

export interface NpmStats {
  downloads: {
    count: number
    date: Date // yyyy-MM
  }[]
}

interface NpmSearchResult {
  package: {
    name: string
  }
  searchScore: number
}

interface Period {
  date: string // yyyy-MM
  end: string
  start: string
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NPM_LOGIN: string
    }
  }
}
