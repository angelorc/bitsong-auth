<script lang="ts" setup>
import { ArrowUpRight, DollarSign } from 'lucide-vue-next'

const { selectedWallet } = useAuth()
const address = computed(() => selectedWallet?.value?.address)

const { data } = await useFetch(`/api/balances`)

const available = computed(() => parseInt(data.value?.data?.available.find(c => c.denom === 'ubtsg')?.amount ?? '0'))
const delegated = computed(() => data.value?.data?.delegations.map(d => parseInt(d.balance.amount)).reduce((a, b) => a + b, 0) ?? 0)
const rewards = computed(() => data.value?.data?.rewards.map(r => parseInt(r.reward.find(c => c.denom === 'ubtsg')?.amount ?? '0')).reduce((a, b) => a + b, 0) ?? 0)
const total = computed(() => available.value + delegated.value + rewards.value)

const delegations = computed(() => data.value?.data?.delegations ?? [])

const toValidatorStatus = (status: string) => {
  switch (status) {
    case 'BOND_STATUS_BONDED':
      return 'Active'
    case 'BOND_STATUS_UNBONDED':
      return 'Inactive'
    default:
      return status
  }
}
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
            {{ (toAmount(total) * 0.01).toFixed(2) }} USD
          </div>
          <p class="text-xs text-muted-foreground">
            {{ toAmount(total) }} BTSG
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Available
          </CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ (toAmount(available) * 0.01).toFixed(2) }} USD
          </div>
          <p class="text-xs text-muted-foreground">
            {{ toAmount(available) }} BTSG
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Delegated
          </CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ (toAmount(delegated) * 0.01).toFixed(2) }} USD
          </div>
          <p class="text-xs text-muted-foreground">
            {{ toAmount(delegated) }} BTSG
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Rewards
          </CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ (toAmount(rewards) * 0.01).toFixed(2) }} USD
          </div>
          <p class="text-xs text-muted-foreground">
            {{ toAmount(rewards) }} BTSG
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:gap-8">
      <AppNoWalletFound v-if="!address" />
      <Card
        v-else
        class="xl:col-span-2"
      >
        <CardHeader class="flex flex-row items-center">
          <div class="grid gap-2">
            <CardTitle>Staking</CardTitle>
          </div>
          <Button
            as-child
            size="sm"
            class="ml-auto gap-1"
          >
            <a href="#">
              Claim Rewards
              <ArrowUpRight class="h-4 w-4" />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead class="text-center">
                  Status
                </TableHead>
                <TableHead class="text-right">
                  Amount
                </TableHead>
                <TableHead class="text-right">
                  Rewards
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(d, i) in delegations"
                :key="i"
              >
                <TableCell class="flex gap-4 items-center">
                  <Avatar class="h-9 w-9">
                    <AvatarImage
                      v-if="d.delegation.validator_avatar"
                      :src="d.delegation.validator_avatar"
                    />
                    <AvatarFallback>
                      {{ d.delegation.validator_name.charAt(0).toUpperCase() }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="font-medium">
                      {{ d.delegation.validator_name }}
                    </div>
                    <div class="hidden text-sm text-muted-foreground md:inline">
                      {{ d.delegation.validator_address }}
                    </div>
                  </div>
                </TableCell>
                <TableCell class="text-center">
                  <Badge
                    class="text-xs"
                    :variant="toValidatorStatus(d.delegation.validator_status) === 'Active' ? 'outline' : 'destructive'"
                  >
                    {{ toValidatorStatus(d.delegation.validator_status) }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  {{ toAmount(d.balance.amount) }} BTSG
                </TableCell>
                <TableCell class="text-right">
                  {{ toAmount(
                    data?.data?.rewards.find(r => r.validator_address === d.delegation.validator_address)?.reward.find(c => c.denom === 'ubtsg')?.amount || '0',
                  ).toFixed(6) }} BTSG
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
