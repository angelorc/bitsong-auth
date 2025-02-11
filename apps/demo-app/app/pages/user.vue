<script setup lang="ts">
// https://better-auth.vercel.app/docs/integrations/nuxt#ssr-usage
const { user, session, wallets, client, signOut } = useAuth()
const { data: accounts } = await useAsyncData('accounts', () => client.listAccounts())

const data = computed(() => {
  return {
    user: user.value,
    session: session.value,
    wallets: wallets.value,
    accounts: accounts.value?.data,
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 overflow-hidden p-4 xl:p-6">
      <div class="grid grid-cols-1 md:grid-cols-1 gap-4 h-full">
        <div class="flex flex-col gap-4 overflow-none">
          <div class="bg-muted/50 p-4 rounded-xl flex-1">
            <textarea
              disabled
              :value="JSON.stringify(data, null, 2)"
              class="bg-transparent h-full w-full resize-none font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </div>

    <p v-if="!user">
      Not signed in
    </p>

    <button @click="signOut({ redirectTo: '/signin' })">
      Sign out
    </button>
  </div>
</template>
