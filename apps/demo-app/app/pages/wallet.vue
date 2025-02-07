<script setup lang="ts">
// const auth = useAuth()

// async function signOut() {
//   await auth.signOut({
//     redirectTo: '/signin',
//   })
// }
</script>

<template>
  <div>
    <!-- <div class="flex items-center p-6">
      <div class="flex flex-col gap-y-1.5">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">
          Wallet
        </h3>
        <p class="text-sm text-muted-foreground">
          TODO: View your summary account
        </p>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          @click="signOut"
        >
          Deposit
        </Button>
      </div>
    </div> -->

    <div class="flex flex-1 flex-col gap-4 p-4 xl:p-6">
      <div class="grid auto-rows-min gap-4 md:grid-cols-3">
        <AppEmbeddedWallet />
        <AppOnOffRamp />
        <!-- <div class="aspect-video rounded-xl bg-muted/50" /> -->
      </div>
      <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  </div>
</template>
