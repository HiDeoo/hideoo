import fs from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'

import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import fetch from 'node-fetch'

const historyFilePath = './history.json'
const minRequestInterval = 2000 // In milliseconds.
const periodFormat = 'yyyy-MM-dd'

export async function fetchRecentNpmDownloads(): Promise<NpmDownloads> {
  const pkgs = await fetchPackages(process.env.NPM_LOGIN)
  const downloads = await fetchRecentNpmPackagesDownloads(pkgs)

  return downloads
}

export async function persistRecentNpmDownloads(recent: NpmDownloads): Promise<NpmYearDownloads> {
  const data = await fs.readFile(historyFilePath, 'utf8')
  const history = JSON.parse(data) as NpmDownloads

  const updatedHistory: NpmDownloads = { ...history, ...recent }

  await fs.writeFile(historyFilePath, JSON.stringify(updatedHistory, null, 2), 'utf8')

  const yearDownloads: NpmYearDownloads = { all: [], total: 0 }
  const periods = getLastYearPeriods().reverse()

  for (const { date } of periods) {
    const monthlyDownloads = updatedHistory[date] ?? 0

    yearDownloads.all.push({ count: monthlyDownloads, date: new Date(date) })
    yearDownloads.total += monthlyDownloads
  }

  return yearDownloads
}

async function fetchPackages(author: string): Promise<NpmPackages> {
  const url = new URL('https://registry.npmjs.org/-/v1/search')
  url.search = new URLSearchParams({ size: '250', text: `maintainer:${author}` }).toString()

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const json = (await response.json()) as { objects: NpmSearchResult[] }

  const pkgs: string[] = []
  const scopedPkgs: string[] = []

  for (const searchResult of json.objects) {
    const name = searchResult.package.name
    if (searchResult.package.name.startsWith('@')) scopedPkgs.push(name)
    else pkgs.push(name)
  }

  return { pkgs, scopedPkgs }
}

async function fetchRecentNpmPackagesDownloads({ pkgs, scopedPkgs }: NpmPackages): Promise<NpmDownloads> {
  const downloads: NpmDownloads = {}

  const { start, end, date } = getCurrentMonthPeriod()
  const range = `${start}:${end}`

  const json = await fetchPackagesDownloads(pkgs, range)

  for (const pkg of pkgs) {
    const dls = json[pkg]?.downloads || 0

    if (downloads[date]) {
      downloads[date] += dls
    } else {
      downloads[date] = dls
    }
  }

  for (const pkg of scopedPkgs) {
    const json = await fetchPackagesDownloads([pkg], range)
    const dls = json[pkg]?.downloads || 0

    if (downloads[date]) {
      downloads[date] += dls
    } else {
      downloads[date] = dls
    }
  }

  return downloads
}

async function fetchPackagesDownloads(pkgs: string[], range: string): Promise<Record<string, { downloads: number }>> {
  const pkgsStr = pkgs.join(',')

  console.info(`Fetching npm downloads for package(s) [${pkgsStr}] (range: ${range})`)

  const response = await fetch(`https://api.npmjs.org/downloads/point/${range}/${pkgsStr}`)

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    const retryAfterMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : undefined

    if (!retryAfterMs || Number.isNaN(retryAfterMs)) {
      throw new Error(
        `Rate limited while fetching npm downloads for ['${pkgsStr}] (range: ${range}) but no valid 'Retry-After' header found.`
      )
    }

    console.info(`Waiting for ${retryAfter}s before retrying to fetch npm downloads for [${pkgsStr}] (range: ${range})`)

    await setTimeout(retryAfterMs + minRequestInterval)

    return fetchPackagesDownloads(pkgs, range)
  }

  if (!response.ok) {
    throw new Error(
      `${response.status}: ${response.statusText} while fetching npm downloads for ['${pkgsStr}] (range: ${range}).`
    )
  }

  await setTimeout(minRequestInterval)

  const json = await response.json()

  return pkgs.length === 1
    ? { [pkgs[0] as string]: json as { downloads: number } }
    : (json as Record<string, { downloads: number }>)
}

function getCurrentMonthPeriod(): Period {
  const now = new Date()

  const end = now
  const start = startOfMonth(now)

  return {
    date: format(start, 'yyyy-MM'),
    start: format(start, periodFormat),
    end: format(end, periodFormat),
  }
}

function getLastYearPeriods() {
  const periods: Period[] = [getCurrentMonthPeriod()]

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

  for (let i = 1; i <= 12; i++) {
    start = subMonths(start, 1)
    end = endOfMonth(start)

    addPeriod(start, end)
  }

  return periods
}

interface NpmPackages {
  pkgs: string[]
  scopedPkgs: string[]
}

export interface NpmDownloads {
  // yyyy-MM: count
  [range: string]: number
}

export interface NpmYearDownloads {
  all: {
    count: number
    date: Date // yyyy-MM
  }[]
  total: number
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
