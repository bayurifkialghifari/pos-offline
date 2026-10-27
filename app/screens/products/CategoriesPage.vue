<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import { Input } from "@/components/atoms/ui/input"
import EmptyState from "@/components/molecules/common/EmptyState.vue"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import { useCategoriesStore } from "@/stores/categories"
import { Check, Pencil, Plus, Tag, Trash2 } from "lucide-vue-next"
import { onMounted, ref } from "vue"

const categories = useCategoriesStore()
const newName = ref("")
const editingId = ref<string | null>(null)
const editName = ref("")

onMounted(() => categories.load())

async function add() {
  const name = newName.value.trim()
  if (!name) return
  await categories.create(name)
  newName.value = ""
}

function startEdit(id: string, name: string) {
  editingId.value = id
  editName.value = name
}

async function saveEdit() {
  if (editingId.value && editName.value.trim()) {
    await categories.rename(editingId.value, editName.value.trim())
  }
  editingId.value = null
}

async function remove(id: string) {
  if (!confirm("Hapus kategori ini? Produk terkait jadi tanpa kategori."))
    return
  await categories.remove(id)
}
</script>

<template>
  <div>
    <AppHeader title="Kategori" back />

    <div class="border-b border-border p-4">
      <div class="flex gap-2">
        <Input
          v-model="newName"
          placeholder="Nama kategori baru"
          @keyup.enter="add"
        />
        <Button class="shrink-0 gap-1" :disabled="!newName.trim()" @click="add">
          <Plus class="size-4" /> Tambah
        </Button>
      </div>
    </div>

    <div v-if="categories.items.length" class="divide-y divide-border">
      <div
        v-for="c in categories.items"
        :key="c.id"
        class="flex items-center gap-3 px-4 py-3"
      >
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <Tag class="size-4" />
        </div>
        <template v-if="editingId === c.id">
          <Input v-model="editName" class="flex-1" @keyup.enter="saveEdit" />
          <Button size="icon" variant="ghost" @click="saveEdit">
            <Check class="size-5 text-foreground" />
          </Button>
        </template>
        <template v-else>
          <span class="flex-1 text-sm font-medium">{{ c.name }}</span>
          <Button size="icon" variant="ghost" @click="startEdit(c.id, c.name)">
            <Pencil class="size-4 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" @click="remove(c.id)">
            <Trash2 class="size-4 text-destructive" />
          </Button>
        </template>
      </div>
    </div>

    <EmptyState
      v-else
      :icon="Tag"
      title="Belum ada kategori"
      description="Kelompokkan produk agar mudah dicari."
    />
  </div>
</template>
