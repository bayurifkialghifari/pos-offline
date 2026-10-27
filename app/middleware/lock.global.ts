import { defineNuxtRouteMiddleware, navigateTo } from "#app"
import { useAuthStore } from "@/stores/auth"
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (auth.isLocked && to.name !== "lock")
    return navigateTo({ path: "/lock", query: { redirect: to.fullPath } })
  if (!auth.isLocked && to.name === "lock") return navigateTo("/")
})
