interface OAuthState {
  connectFirst?: boolean
  timestamp: number
  returnUrl?: string
}

export function encodeState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64')
}

export function decodeState(stateParam: string): OAuthState {
  try {
    const decoded = Buffer.from(stateParam, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode OAuth state:', error)
    throw new Error('Invalid state parameter')
  }
}