<script setup lang="ts">
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import AppVersionCard from "@/components/organisms/settings/AppVersionCard.vue"
</script>
<template>
  <div class="pb-8">
    <AppHeader title="Tentang aplikasi" subtitle="Versi dan pembaruan" back />
    <div class="mx-auto max-w-3xl p-4 md:p-6"><AppVersionCard /></div>
  </div>
</template>
