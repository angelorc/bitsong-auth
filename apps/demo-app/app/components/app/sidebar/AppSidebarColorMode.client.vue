<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const colorMode = useColorMode()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <DropdownMenuItem @click="toggleColorMode">
    <Moon v-if="colorMode.value === 'light'" />
    <Sun v-else />
    {{ colorMode.value === 'light' ? 'Dark mode' : 'Light mode' }}
  </DropdownMenuItem>
</template>
