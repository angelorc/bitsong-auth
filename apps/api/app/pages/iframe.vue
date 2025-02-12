<script lang="ts" setup>
import { createChildIFrameRPCSession } from 'safe-rpc-iframe'
import { ChildRPCHandlerClass } from '~/lib/iframe'
import type { IParentFrameRPCInterface } from '~/lib/iframe'

definePageMeta({
  layout: false,
})

async function initChild() {
  const session = await createChildIFrameRPCSession()
  console.log('[iframe] child session created')

  session.registerHandlerClass<ChildRPCHandlerClass, IParentFrameRPCInterface>(
    peer => new ChildRPCHandlerClass(peer),
  )
}

onMounted(async () => await initChild())
</script>

<template>
  <div>iframe</div>
</template>
