export default defineEventHandler(async (event) => {
  return await getCoingeckoPrices(event, ['cosmos', 'bitsong', 'osmosis'])
})
