import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

import { getDataset, getProjectId } from '../env'

let builder: ReturnType<typeof createImageUrlBuilder> | null = null

function getBuilder() {
  if (!builder) {
    builder = createImageUrlBuilder({ projectId: getProjectId(), dataset: getDataset() })
  }
  return builder
}

export const urlFor = (source: SanityImageSource) => {
  return getBuilder().image(source)
}
