<script lang="ts" setup>
const { wallet, fetchSession, createWallet } = useAuth()

const address = computed(() => wallet?.value?.addresses?.cosmos?.bitsong)

const loading = ref(false)

async function newWallet() {
  try {
    loading.value = true
    const address = await createWallet()
    alert(`New wallet created: ${address}`)
    await fetchSession()
  }
  catch (e) {
    console.error(`Error - ${(e as Error).message}`)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle class="text-2xl font-bold">
        Wallet
      </CardTitle>
      <CardDescription>Manage your crypto assets</CardDescription>
    </CardHeader>
    <CardContent
      v-if="!address"
      class="text-sm space-y-3 text-center"
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
    <CardContent
      v-else
      class="space-y-4"
    >
      <div class="flex items-center space-x-4">
        <Avatar class="h-12 w-12">
          <AvatarImage
            src="https://bitsong.io/web-app-manifest-512x512.png"
          />
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
        <div>
          <p class="text-sm font-medium">
            BitSong Address
          </p>
          <p class="text-xs text-muted-foreground">
            {{ address }}
          </p>
        </div>
      </div>
      <div>
        <p class="text-sm font-medium">
          Balance
        </p>
        <p class="text-2xl font-bold">
          0 BTSG
        </p>
      </div>
    </CardContent>
  </Card>
</template>
