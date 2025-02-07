<template>
  <div>
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <AppTopbar />

        <slot />
      </SidebarInset>
    </SidebarProvider>
    <Toaster />
  </div>
</template>
