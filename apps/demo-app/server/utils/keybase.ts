interface KeybaseResponse {
  list: {
    keybase: {
      picture_url: string
    }
  }[]
}

export const getValidatorAvatar = defineCachedFunction(async (identity: string): Promise<string | null> => {
  const keybase = await $fetch<KeybaseResponse>(`https://keybase.io/_/api/1.0/user/user_search.json?q=${identity}&num_wanted=1`)

  return keybase.list[0]?.keybase?.picture_url ?? null
}, {
  maxAge: 60 * 60 * 24 * 365,
  name: 'getValidatorAvatar',
  getKey: (identity: string) => identity,
})
