<script setup lang="ts">
// const { dialogOpen, isLoggedIn } = useAuth()
</script>

<template>
  <header
    class="flex p-2 pr-6 pt-3 justify-between h-18 top-0 items-center gap-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-4 md:gap-2 lg:gap-4">
      <div class="flex items-center gap-2 px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator
          orientation="vertical"
          class="mr-2 h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbPage>Page Title</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>

    <div class="flex items-center md:ml-auto gap-4 md:gap-2 lg:gap-4">
      <!-- <Button
        size="sm"
      >
        Logout
      </Button> -->
    </div>
  </header>
</template>
