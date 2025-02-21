<script lang="ts" setup>
import { ArrowUpRight, DollarSign } from 'lucide-vue-next'

const { selectedWallet } = useAuth()
const address = computed(() => selectedWallet?.value?.address)

const { data } = await useFetch(`/api/wallet-balance`, {
  watch: [address],
  params: {
    address: address.value,
  },
})
</script>

<template>
  <main class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Total
          </CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatUsd(data?.value_usd) }} USD
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:gap-8">
      <Card class="xl:col-span-2">
        <CardHeader class="flex flex-row items-center">
          <div class="grid gap-2">
            <CardTitle>Wallet</CardTitle>
          </div>
          <Button
            as-child
            size="sm"
            class="ml-auto gap-1"
          >
            <a href="#">
              Send
              <ArrowUpRight class="h-4 w-4" />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead class="text-right">
                  Balance
                </TableHead>
                <TableHead class="text-right">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(b, i) in data?.balances"
                :key="i"
              >
                <TableCell class="flex gap-4 items-center">
                  <Avatar class="h-9 w-9">
                    <AvatarImage
                      v-if="b.logo"
                      :src="b.logo"
                    />
                    <AvatarFallback>
                      {{ b.symbol }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="font-medium">
                      {{ b.name }}
                    </div>
                    <div class="hidden text-sm text-muted-foreground md:inline">
                      {{ b.symbol || b.denom }}
                    </div>
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <div class="font-medium">
                    {{ formatNumber(b.formatted_amount, { maximumFractionDigits: 6 }) }} {{ b.symbol }}
                  </div>
                  <div class="hidden text-sm text-muted-foreground md:inline">
                    $ {{ formatNumber(b.value_usd, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  $ {{ b.price ? formatNumber(b.price, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : 0 }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
