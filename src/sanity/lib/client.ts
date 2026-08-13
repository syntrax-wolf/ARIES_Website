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
 * Falls back gracefully at build time when env vars aren't set.
 */
export const client = new Proxy({} as SanityClient, {
  get(_target, prop) {
    return (getClient() as any)[prop]
  },
})
