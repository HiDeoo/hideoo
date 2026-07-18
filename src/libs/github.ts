import { type User } from '@octokit/graphql-schema'
import { addMinutes, endOfDay, format, startOfMonth, subDays, subMonths } from 'date-fns'
import fetch, { type BodyInit } from 'node-fetch'

import { CONFIG } from '../config'

export async function fetchGitHubContributions(): Promise<GitHubContributions> {
  // Today.
  let to = new Date()
  // 5 months ago, and the first day of that month.
  let from = startOfMonth(subMonths(to, 5))

  // GitHub suddenly failed with RESOURCE_LIMITS_EXCEEDED, so we now fetch the current and previous five calendar
  // months, the preceding six months, and finally the month from 12 months ago.
  // Related: https://github.com/orgs/community/discussions/202200
  const recentContributions = await fetchContributionsBetween(from, to)

  // 6 months ago, and the last day of that month.
  to = endOfDay(subDays(from, 1))
  // 11 months ago, and the first day of that month.
  from = startOfMonth(subMonths(to, 5))

  const earlierContributions = await fetchContributionsBetween(from, to)

  // 12th month ago, and the last day of that month, which is the day before the first day of the 11th month.
  to = endOfDay(subDays(from, 1))
  // 12 months ago, and the first day of that month.
  from = startOfMonth(to)

  const twelfthMonthData = await fetchContributionsBetween(from, to)

  return parseContributions(
    mergeContributions(mergeContributions(recentContributions, earlierContributions), twelfthMonthData)
  )
}

export async function fetchGitHubLanguages(): Promise<GitHubLanguages> {
  // Today.
  let to = new Date()
  // 6 months ago.
  let from = subMonths(to, 6)

  // GitHub suddenly failed with RESOURCE_LIMITS_EXCEEDED, so we now fetch languages for repositories with contributions
  // in the last six months, then in the six months before that, and merge the results by repository.
  // Related: https://github.com/orgs/community/discussions/202200
  const recentLanguages = await fetchLanguagesBetween(from, to)

  // 6 months ago.
  to = from
  // 12 months ago.
  from = subMonths(to, 6)

  const earlierLanguages = await fetchLanguagesBetween(from, to)

  return parseLanguages([recentLanguages, earlierLanguages])
}

async function fetchLanguagesBetween(from: Date, to: Date) {
  console.info('Fetching GitHub user languages')

  return fetchGraphQLApi<ContributionsCollection>(
    JSON.stringify({
      query: `
      query Languages($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                id
                languages(first: 10, orderBy: { direction: DESC, field: SIZE }) {
                  edges {
                    size
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
      `,
      variables: {
        from,
        login: process.env.GH_LOGIN,
        to,
      },
    })
  )
}

function mergeContributions(dataA: ContributionsCollection, dataB: ContributionsCollection) {
  dataA.user.contributionsCollection.contributionCalendar.weeks.unshift(
    ...dataB.user.contributionsCollection.contributionCalendar.weeks
  )

  dataA.user.contributionsCollection.contributionCalendar.totalContributions +=
    dataB.user.contributionsCollection.contributionCalendar.totalContributions

  return dataA
}

function parseLanguages(data: ContributionsCollection[]): GitHubLanguages {
  const parsedRepositories = new Set<string>()
  const allLanguages: Record<string, number> = {}
  let totalSize = 0

  for (const contributionsCollection of data) {
    for (const contributions of contributionsCollection.user.contributionsCollection.commitContributionsByRepository) {
      if (parsedRepositories.has(contributions.repository.id) || !contributions.repository.languages?.edges) {
        continue
      }

      parsedRepositories.add(contributions.repository.id)

      for (const languageEdge of contributions.repository.languages.edges) {
        if (!languageEdge) {
          continue
        }

        allLanguages[languageEdge.node.name] = (allLanguages[languageEdge.node.name] ?? 0) + languageEdge.size

        totalSize += languageEdge.size
      }
    }
  }

  for (const language in allLanguages) {
    const size = allLanguages[language]

    if (!size) {
      continue
    }

    let newSize = Math.trunc((100 * size) / totalSize)

    if (newSize < 5) {
      newSize += 5
    }

    allLanguages[language] = newSize
  }

  return Object.entries(allLanguages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, CONFIG.charts.languages.limit)
}

function parseContributions(data: ContributionsCollection): GitHubContributions {
  const contributions: GitHubContributions['all'] = []

  for (const contributionWeek of data.user.contributionsCollection.contributionCalendar.weeks) {
    for (const contributionDay of contributionWeek.contributionDays) {
      const lastContribution = contributions[contributions.length - 1]

      const date = new Date(format(new Date(contributionDay.date), 'yyyy-MM'))

      if (contributions.length === 0 || (lastContribution && lastContribution.date.getTime() !== date.getTime())) {
        contributions.push({ date, count: contributionDay.contributionCount })
      } else if (lastContribution) {
        lastContribution.count += contributionDay.contributionCount
      }
    }
  }

  return {
    all: contributions,
    total: data.user.contributionsCollection.contributionCalendar.totalContributions,
  }
}

async function fetchContributionsBetween(from: Date, to: Date) {
  console.info('Fetching GitHub user contributions')

  const data = await fetchGraphQLApi<ContributionsCollection>(
    JSON.stringify({
      query: `
      query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
      `,
      variables: {
        from: addMinutes(from, new Date().getTimezoneOffset() * -1),
        login: process.env.GH_LOGIN,
        to: addMinutes(to, new Date().getTimezoneOffset() * -1),
      },
    })
  )

  return data
}

async function fetchGraphQLApi<T>(body: BodyInit): Promise<T> {
  const response = await fetch('https://api.github.com/graphql', {
    headers: {
      Authorization: `bearer ${process.env.GH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText} while fetching the GitHub GraphQL API.`)
  }

  const result = (await response.json()) as GraphQLResponse<T>

  if (result.errors?.length) {
    throw new Error(`GitHub GraphQL API: ${result.errors.map((error) => error.message).join(' - ')}`)
  }

  if (!result.data) {
    throw new Error('GitHub GraphQL API returned no data.')
  }

  return result.data
}

export interface GitHubContributions {
  all: {
    count: number
    date: Date // yyyy-MM
  }[]
  total: number
}

export type GitHubLanguages = [name: string, count: number][]

interface ContributionsCollection {
  user: Pick<User, 'contributionsCollection'>
}

interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string }[]
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GH_LOGIN: string
      GH_TOKEN: string
    }
  }
}
