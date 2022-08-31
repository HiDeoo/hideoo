import { type User } from '@octokit/graphql-schema'
import { addMinutes, endOfDay, format, startOfMonth, subDays, subMonths } from 'date-fns'
import fetch, { type BodyInit } from 'node-fetch'

import { CONFIG } from '../config'

export async function fetchGitHubContributions(): Promise<GitHubContributions> {
  let to = new Date()
  let from = startOfMonth(subMonths(to, 11))

  const elevenMonthsData = await fetchContributionsBetween(from, to)

  to = endOfDay(subDays(from, 1))
  from = startOfMonth(to)

  const twelfthMonthData = await fetchContributionsBetween(from, to)

  return parseContributions(mergeContributions(elevenMonthsData, twelfthMonthData))
}

export async function fetchGitHubLanguages(): Promise<GitHubLanguages> {
  console.info('Fetching GitHub user languages')

  const response = await fetchGraphQLApi(
    JSON.stringify({
      query: `
      query Languages($login: String!) {
        user(login: $login) {
          contributionsCollection {
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
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
        login: process.env.GITHUB_LOGIN,
      },
    })
  )

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText} while fetching GitHub user contributions.`)
  }

  const json = (await response.json()) as { data: ContributionsCollection }

  return parseLanguages(json.data)
}

function mergeContributions(dataA: ContributionsCollection, dataB: ContributionsCollection) {
  dataA.user.contributionsCollection.contributionCalendar.weeks.unshift(
    ...dataB.user.contributionsCollection.contributionCalendar.weeks
  )

  dataA.user.contributionsCollection.contributionCalendar.totalContributions +=
    dataB.user.contributionsCollection.contributionCalendar.totalContributions

  return dataA
}

function parseLanguages(data: ContributionsCollection): GitHubLanguages {
  const allLanguages: Record<string, number> = {}
  let totalSize = 0

  for (const contributions of data.user.contributionsCollection.commitContributionsByRepository) {
    if (!contributions.repository.languages?.edges) {
      continue
    }

    for (const languageEdge of contributions.repository.languages.edges) {
      if (!languageEdge) {
        continue
      }

      allLanguages[languageEdge.node.name] = (allLanguages[languageEdge.node.name] ?? 0) + languageEdge.size

      totalSize += languageEdge.size
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

  const response = await fetchGraphQLApi(
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
        login: process.env.GITHUB_LOGIN,
        to: addMinutes(to, new Date().getTimezoneOffset() * -1),
      },
    })
  )

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText} while fetching GitHub user contributions.`)
  }

  const json = (await response.json()) as { data: ContributionsCollection }

  return json.data
}

function fetchGraphQLApi(body: BodyInit) {
  return fetch('https://api.github.com/graphql', {
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
    method: 'POST',
  })
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

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_LOGIN: string
      GITHUB_TOKEN: string
    }
  }
}
