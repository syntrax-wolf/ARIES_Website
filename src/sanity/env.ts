export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-08'

export function getDataset(): string {
  return assertValue(
    process.env.NEXT_PUBLIC_SANITY_DATASET,
    'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
  )
}

export function getProjectId(): string {
  return assertValue(
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
  )
}

/** @deprecated Use getDataset() — kept for sanity.config.ts compatibility */
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || ''

/** @deprecated Use getProjectId() — kept for sanity.config.ts compatibility */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''

function assertValue(v: string | undefined, errorMessage: string): string {
  if (!v) {
    throw new Error(errorMessage)
  }

  return v
}
