<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{ source: string }>()
type Block =
  | { readonly kind: "heading"; readonly level: number; readonly text: string }
  | { readonly kind: "list"; readonly items: readonly string[] }
  | { readonly kind: "paragraph"; readonly text: string }

const blocks = computed(() => {
  const result: Block[] = []
  let paragraph: string[] = []
  let items: string[] = []
  function flush() {
    if (paragraph.length)
      result.push({ kind: "paragraph", text: paragraph.join(" ") })
    if (items.length) result.push({ kind: "list", items })
    paragraph = []
    items = []
  }
  for (const line of props.source.split(/\r?\n/)) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading?.[1] && heading[2]) {
      flush()
      result.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2].replace(/\[([^\]]+)\]/g, "$1"),
      })
    } else if (line.startsWith("- ")) {
      if (paragraph.length) flush()
      items.push(line.slice(2))
    } else if (line.trim()) {
      if (items.length) flush()
      paragraph.push(line.trim())
    } else flush()
  }
  flush()
  return result
})
</script>

<template>
  <div class="space-y-4 break-words text-sm leading-relaxed">
    <template v-for="(block, index) in blocks" :key="index">
      <h3
        v-if="block.kind === 'heading'"
        class="font-semibold text-foreground"
        :class="block.level < 3 ? 'pt-2 text-lg' : 'text-sm'"
      >
        {{ block.text }}
      </h3>
      <ul
        v-else-if="block.kind === 'list'"
        class="list-disc space-y-2 pl-5 text-muted-foreground"
      >
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
          {{ item }}
        </li>
      </ul>
      <p v-else class="text-muted-foreground">{{ block.text }}</p>
    </template>
  </div>
</template>
