<script setup lang="ts">
import { ChevronsUpDown, Plus, LogOut, Landmark, Banknote, Store, LayoutDashboard } from 'lucide-vue-next'

const organizations = [
  { name: 'My Profile' },
  { name: 'Profile 2' },
  { name: 'Profile 3' },
]

const activeOrganization = ref(organizations[0])

const { user, signOut } = useAuth()
</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-bold">{{ activeOrganization.name }}</span>
                </div>
                <ChevronsUpDown class="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side="bottom"
              :side-offset="4"
            >
              <DropdownMenuLabel class="text-xs text-muted-foreground">
                Profiles
              </DropdownMenuLabel>
              <DropdownMenuItem
                v-for="(org, index) in organizations"
                :key="org.name"
                class="gap-2 p-2"
                @click="setActiveTeam(org)"
              >
                {{ org.name }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="gap-2 p-2">
                <div class="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus class="size-4" />
                </div>
                <div class="font-medium text-muted-foreground">
                  Create Profile
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem @click="navigateTo('/')">
              <SidebarMenuButton class="font-semibold">
                <component :is="LayoutDashboard" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem @click="() => navigateTo('/earn')">
              <SidebarMenuButton class="font-semibold">
                <component :is="Landmark" />
                <span>Earn</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem @click="() => navigateTo('/user')">
              <SidebarMenuButton class="font-semibold">
                <component :is="Landmark" />
                <span>User</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <!-- <SidebarMenuItem @click="() => navigateTo('/wallet')">
              <SidebarMenuButton class="font-semibold">
                <component :is="Landmark" />
                <span>Wallet</span>
              </SidebarMenuButton>
            </SidebarMenuItem> -->
            <SidebarMenuItem>
              <SidebarMenuButton class="font-semibold">
                <component :is="Store" />
                <span>Explore Music</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton class="font-semibold">
                <component :is="Store" />
                <span>Fantokens</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel class="text-muted-foreground font-semibold">
          Playlists
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton class="font-semibold">
                <component :is="Banknote" />
                <span>Playlist 1</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar class="h-8 w-8 rounded-full">
                  <AvatarImage
                    v-if="user?.image"
                    :src="user?.image"
                    :alt="user.name"
                  />
                  <AvatarFallback class="rounded-full">
                    {{ user?.name?.split(' ').map((n) => n[0]).join('') }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ user?.name }}</span>
                  <span class="truncate text-xs">{{ user?.email }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              :side-offset="4"
            >
              <ClientOnly>
                <AppSidebarColorMode />
              </ClientOnly>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="signOut({ redirectTo: '/signin' })">
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
