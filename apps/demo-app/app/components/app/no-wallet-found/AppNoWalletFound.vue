<script lang="ts" setup>
const { createWallet } = useIframe()
const { fetchSession } = useAuth()

const loading = ref(false)

async function newWallet() {
  loading.value = true
  try {
    const { error } = await createWallet()
    if (error) {
      throw new Error(error)
    }
    await fetchSession()
  }
  catch (e) {
    alert((e as Error).message)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="text-2xl font-bold">
        Wallet
      </CardTitle>
    </CardHeader>
    <CardContent
      class="text-sm space-y-3 text-center mb-6"
    >
      <div>No wallet detected</div>
      <Button
        :disabled="loading"
        @click="newWallet"
      >
        <AppLoading v-if="loading" />
        Create Wallet
      </Button>
    </CardContent>
  </Card>
</template>
