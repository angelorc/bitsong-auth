<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    :class="cn('mr-2 inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin', props.class)"
  />
</template>
