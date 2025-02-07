<script lang="ts" setup>
import { ChevronRight, Settings } from 'lucide-vue-next'

const quickAmounts = [100, 250, 500, 1000]

const amount = ref(0)
const amountRef = ref<HTMLInputElement | null>(null)

const amountStyle = computed(() => {
  const baseWidth = 50
  const maxWidth = 320
  const minFontSize = 14
  const maxFontSize = 56

  // Calculate width based on content length
  const contentLength = String(amount.value).length
  const calculatedWidth = Math.min(baseWidth + (contentLength * 30), maxWidth)

  // Calculate font size - only decrease if width reaches maximum
  let fontSize = maxFontSize
  if (calculatedWidth >= maxWidth) {
    const excess = contentLength - ((maxWidth - baseWidth) / 80)
    fontSize = Math.max(maxFontSize - (excess * 2), minFontSize)
  }

  return {
    width: `${calculatedWidth}px`,
    fontSize: `${fontSize}px`,
  }
})
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader class="flex flex-row items-center justify-between pt-4">
      <h2 class="text-xl font-semibold text-center">
        Buy
      </h2>
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full"
      >
        <Settings class="h-5 w-5" />
        <span class="sr-only">Settings</span>
      </Button>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-2">
        <div class="relative mb-3 flex w-full items-center justify-center">
          <div class="relative flex-row justify-center">
            <div class="absolute -left-4 -top-1 text-2xl font-medium text-muted-foreground">
              €
            </div>
            <input
              ref="amountRef"
              v-model="amount"
              inputmode="decimal"
              min="0"
              pattern="[0-9]*"
              class="h-14 bg-transparent text-center font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              :style="amountStyle"
            >
          </div>
        </div>
        <p class="text-sm font-medium text-center text-muted-foreground">
          15.232,22 BTSG
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button
          v-for="(amount, i) in quickAmounts"
          :key="i"
          variant="ghost"
          class="py-4 rounded-full bg-muted/70"
        >
          € {{ amount }}
        </Button>
      </div>

      <div class="space-y-6">
        <Button
          variant="outline"
          class="w-full justify-between py-8 text-lg bg-muted/70"
        >
          <div class="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                class="h-5 w-5"
                src="https://bitsong.io/web-app-manifest-512x512.png"
              />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <span>BitSong</span>
          </div>
          <ChevronRight class="w-5 h-5" />
        </Button>
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full py-6 text-base">
        Continue
      </Button>
    </CardFooter>
  </Card>
</template>
