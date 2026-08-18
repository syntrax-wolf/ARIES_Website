export const apiVersion =
  sanitizeEnv(process.env.NEXT_PUBLIC_SANITY_API_VERSION) || '2026-08-08'

export function getDataset(): string {
  return assertValue(
    sanitizeEnv(process.env.NEXT_PUBLIC_SANITY_DATASET),
    'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
  )
}

export function getProjectId(): string {
  return assertValue(
    sanitizeEnv(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
    'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
  )
}

/** @deprecated Use getDataset() — kept for sanity.config.ts compatibility */
export const dataset = sanitizeEnv(process.env.NEXT_PUBLIC_SANITY_DATASET) || ''

/** @deprecated Use getProjectId() — kept for sanity.config.ts compatibility */
export const projectId = sanitizeEnv(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) || ''

function sanitizeEnv(v: string | undefined): string | undefined {
  if (v == null) return undefined

  let value = v.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }

  return value || undefined
}

function assertValue(v: string | undefined, errorMessage: string): string {
  if (!v) {
    throw new Error(errorMessage)
  }

  return v
}
