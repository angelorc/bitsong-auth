<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: {
    only: 'guest',
    redirectUserTo: '/',
  },
})

const { signIn: _signIn, openWallet } = useAuth()

const loading = ref(false)

type Provider = 'github' | 'google'

async function signIn(provider: Provider) {
  loading.value = true

  const { error } = await _signIn.social({
    provider,
    // callbackURL: import.meta.dev ? 'http://localhost:3001' : 'https://demo-auth.bitsong.io',
  })
  if (error) {
    console.log(error.message)
    loading.value = false
  }
  else {
    console.log('signed in')
    await navigateTo('/')
  }
}
</script>

<template>
  <div class="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <div class="flex items-center justify-center py-12">
      <div class="mx-auto grid w-[350px] gap-6">
        <div class="grid gap-2 text-center">
          <h1 class="text-3xl font-bold">
            BitSong Auth Demo
          </h1>
          <p class="text-balance text-muted-foreground">
            Sign in to continue
          </p>
        </div>
        <div class="grid gap-4">
          <Button
            variant="outline"
            class="w-full"
            size="lg"
            @click="async () => await openWallet('keplrextension')"
          >
            <AppLoading v-if="loading" />
            Sign in with Keplr
          </Button>
          <Button
            variant="outline"
            class="w-full"
            size="lg"
            @click="signIn('google')"
          >
            <AppLoading v-if="loading" />
            <Icon
              v-else
              name="cib:google"
              class="mr-2 h-4 w-4"
            />
            Sign in with Google
          </Button>

          <Button
            variant="outline"
            class="w-full"
            size="lg"
            @click="signIn('github')"
          >
            <AppLoading v-if="loading" />
            <Icon
              v-else
              name="cib:github"
              class="mr-2 h-4 w-4"
            />
            Sign in with Github
          </Button>
        </div>
      </div>
    </div>
    <div class="hidden bg-muted lg:block">
      <img
        src="/placeholder.svg"
        alt="Image"
        width="1920"
        height="1080"
        class="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      >
    </div>
  </div>
</template>