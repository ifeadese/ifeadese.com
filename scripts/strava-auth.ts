/**
 * One-time Strava OAuth helper. Exchanges an authorization code for a refresh token.
 *
 * Usage:
 *   1. Register an app at https://www.strava.com/settings/api
 *      - Authorization Callback Domain: localhost
 *   2. STRAVA_CLIENT_ID=xxx STRAVA_CLIENT_SECRET=yyy npx tsx scripts/strava-auth.ts
 *   3. Open the printed URL, authorize, copy the `code` from the redirect URL
 *   4. Paste the code when prompted
 *   5. Add the printed refresh token as the STRAVA_REFRESH_TOKEN repo secret
 */

import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const REDIRECT_URI = 'http://localhost'

async function main() {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET env vars first.')
  }

  const authUrl = new URL('https://www.strava.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('approval_prompt', 'force')
  authUrl.searchParams.set('scope', 'activity:read_all')

  console.log('\nOpen this URL in your browser and authorize the app:\n')
  console.log(authUrl.toString())
  console.log('\nAfter redirect, copy the `code` query param from the URL bar.\n')

  const rl = readline.createInterface({ input, output })
  const code = (await rl.question('Paste authorization code: ')).trim()
  rl.close()

  if (!code) {
    throw new Error('No authorization code provided.')
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()

  console.log('\nSuccess! Add these GitHub repo secrets:\n')
  console.log(`  STRAVA_CLIENT_ID=${clientId}`)
  console.log(`  STRAVA_CLIENT_SECRET=${clientSecret}`)
  console.log(`  STRAVA_REFRESH_TOKEN=${data.refresh_token}`)
  console.log('\nThen run: npm run sync')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
