import type { H3Event } from 'h3'

type CachedPrice = {
  price: number
  mtime: number
}

// https://api.coingecko.com/api/v3/simple/price?ids=bitsong,osmosis,cosmos&vs_currencies=usd
// {
//   "bitsong": {
//     "usd": 0.00943902
//   },
//   "cosmos": {
//     "usd": 4.87
//   },
//   "osmosis": {
//     "usd": 0.335333
//   }
// }

type CoingeckoResponse = {
  [id: string]: {
    usd: number
  }
}

async function fetchCoingeckoPrices(event: H3Event, ids: string[]) {
  const response = await $fetch<CoingeckoResponse>(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`)

  const cachePromises = ids.map(async (id) => {
    try {
      await useStorage('cache').setItem(`coingecko:${id}`, {
        price: response[id].usd,
        mtime: Date.now(),
      })
    }
    catch (error) {
      console.error(`[nitro] [cache] Cache write error.`, error)
      useNitroApp().captureError(error as Error, { event, tags: ['cache'] })
    }
  })

  if (event?.waitUntil) {
    event.waitUntil(Promise.all(cachePromises))
  }
  else {
    await Promise.all(cachePromises)
  }
}

export async function getCoingeckoPrices(event: H3Event, ids: string[]) {
  const now = Date.now()
  const cacheEntries = await Promise.all(
    ids.map(async (id) => {
      try {
        const entry = await useStorage('cache').getItem<CachedPrice>(`coingecko:${id}`)
        return { id, entry }
      }
      catch (error) {
        console.error(`[nitro] [cache] Cache read error.`, error)
        useNitroApp().captureError(error as Error, { event, tags: ['cache'] })
        return { id, entry: null }
      }
    }),
  )

  const staleIds = cacheEntries
    .filter(({ entry }) => !entry || now - entry.mtime > 1000 * 60 * 5) // 5 minutes
    .map(({ id }) => id)

  if (staleIds.length > 0) {
    console.log('stale', staleIds)
    await fetchCoingeckoPrices(event, staleIds)

    // Update cache entries with fresh data
    for (const id of staleIds) {
      try {
        const entry = await useStorage('cache').getItem<CachedPrice>(`coingecko:${id}`)
        if (entry) {
          const index = cacheEntries.findIndex(e => e.id === id)
          if (index !== -1) {
            cacheEntries[index].entry = entry
          }
        }
      }
      catch (error) {
        console.error(`[nitro] [cache] Cache read error.`, error)
        useNitroApp().captureError(error as Error, { event, tags: ['cache'] })
      }
    }
  }

  return cacheEntries
    .filter(({ entry }) => entry !== null)
    .map(({ id, entry }) => ({ id, price: entry!.price }))
}
