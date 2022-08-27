import { type User } from '@octokit/graphql-schema'
import { format } from 'date-fns'
import fetch from 'node-fetch'

export async function fetchGitHubStats(): Promise<GitHubStats> {
  const data = await fetchUserData()

  return parseGitHubData(data)
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

async function fetchUserData() {
  const response = await fetch('https://api.github.com/graphql', {
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query UserInfos($login: String!) {
          user(login: $login) {
            contributionsCollection {
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
        login: process.env.GITHUB_LOGIN,
      },
    }),
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(response.statusText)
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
