import { type User } from '@octokit/graphql-schema'
import { addMinutes, endOfDay, format, startOfMonth, subDays, subMonths } from 'date-fns'
import fetch from 'node-fetch'

export async function fetchGitHubStats(): Promise<GitHubStats> {
  let to = new Date()
  let from = startOfMonth(subMonths(to, 11))

  const elevenMonthsData = await fetchUserData(from, to)

  to = endOfDay(subDays(from, 1))
  from = startOfMonth(to)

  const twelfthMonthData = await fetchUserData(from, to)

  return parseGitHubData(mergeGitHubData(elevenMonthsData, twelfthMonthData))
}

function mergeGitHubData(dataLeft: GitHubUserData, dataRight: GitHubUserData) {
  dataLeft.user.contributionsCollection.contributionCalendar.weeks.unshift(
    ...dataRight.user.contributionsCollection.contributionCalendar.weeks
  )

  return dataLeft
}

function parseGitHubData(data: GitHubUserData): GitHubStats {
  const contributions: GitHubStats['contributions'] = []

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

  return { contributions }
}

async function fetchUserData(from: Date, to: Date) {
  console.info('Fetching GitHub user data')

  const response = await fetch('https://api.github.com/graphql', {
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query UserInfos($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
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
    }),
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText} while fetching GitHub user data.`)
  }

  const json = (await response.json()) as { data: GitHubUserData }

  return json.data
}

export interface GitHubStats {
  contributions: {
    count: number
    date: Date // yyyy-MM
  }[]
}

interface GitHubUserData {
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
