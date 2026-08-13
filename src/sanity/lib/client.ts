import { createClient, type SanityClient } from 'next-sanity'

import { apiVersion, getDataset, getProjectId } from '../env'

let _client: SanityClient | null = null

export function getClient(): SanityClient {
  if (!_client) {
    _client = createClient({
      projectId: getProjectId(),
      dataset: getDataset(),
      apiVersion,
      useCdn: true,
    })
  }
  return _client
}

/**
 * Lazy-initialized client for backward compat with existing blog pages.
 * Uses a Proxy that binds methods to the real instance (required because
 * next-sanity uses private class fields which break if `this` is a Proxy).
 */
export const client = new Proxy({} as SanityClient, {
  get(_target, prop) {
    const value = (getClient() as any)[prop]
    if (typeof value === 'function') {
      return value.bind(getClient())
    }
    return value
  },
})
