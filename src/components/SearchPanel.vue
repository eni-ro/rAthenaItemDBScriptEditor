<template>
  <div class="search-panel d-flex flex-column h-100">
    <!-- Search Box -->
    <div class="pa-2 border-b flex-shrink-0">
      <v-text-field
        v-model="rawSearch"
        append-inner-icon="mdi-magnify"
        label="Search (AegisName / Name / SearchName)"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        class="text-caption"
      />
      <div class="text-caption text-grey mt-1 px-1">
        {{ results.length }} items
      </div>
    </div>

    <!-- Result List (virtual scroll) -->
    <v-virtual-scroll
      :items="results"
      item-height="36"
      class="flex-grow-1"
      style="min-height: 0; height: 0;"
    >
      <template #default="{ item: r }">
        <v-list-item
          :key="r.key"
          :class="['result-item', r.type === 'item' ? 'item-row' : 'combo-row']"
          density="compact"
          @click="onSelect(r)"
          @contextmenu.prevent="onContextMenu($event, r)"
          :active="isActive(r)"
          active-color="primary"
        >
          <template #prepend>
            <v-chip
              :color="r.type === 'item' ? 'blue-darken-1' : 'green-darken-1'"
              size="x-small"
              variant="flat"
              class="mr-1 chip-label"
              label
            >{{ r.type === 'item' ? 'I' : 'C' }}</v-chip>
          </template>
          <v-list-item-title class="result-label">{{ r.label }}</v-list-item-title>
        </v-list-item>
      </template>
    </v-virtual-scroll>

    <!-- Context Menu Anchor -->
    <div
      v-show="contextMenu.show"
      style="position: fixed; z-index: 9999;"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <v-menu v-model="contextMenu.show" activator="parent" :close-on-content-click="true">
        <v-list density="compact" min-width="150">
          <v-list-item @click="onCopy">
            <template #prepend><v-icon size="small" class="mr-2">mdi-content-copy</v-icon></template>
            <v-list-item-title>コピー (Copy)</v-list-item-title>
          </v-list-item>
          <v-list-item @click="onDelete" class="text-error">
            <template #prepend><v-icon size="small" class="mr-2" color="error">mdi-delete</v-icon></template>
            <v-list-item-title>削除 (Delete)</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { useGlobals } from '../composables/useAppModel';
import type { ItemDbEntry, ComboDbEntry } from '../lib/DbReader';

const appModel = useGlobals();
const rawSearch = ref('');
const debouncedSearch = ref('');

// debounce: 200ms
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(rawSearch, val => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val ?? '';
  }, 200);
});

interface SearchResult {
  key: string;
  type: 'item' | 'combo';
  label: string;
  item?: ItemDbEntry;
  combo?: ComboDbEntry;
  _search: string;
}

// Build item list beforehand (fixed after startup)
const allItemResults = computed<SearchResult[]>(() => {
  return appModel.getItems().map(item => ({
    key: `item-${item.filePath}-${item.aegis_name}`,
    type: 'item' as const,
    label: appModel.getDisplayName(item),
    _search: (item.aegis_name + item.name + (appModel.getItemNames().get(item.id) || '') + (item.slots != null ? `[${item.slots}]` : '')).toLowerCase(),
    item,
  }));
});

const allComboResults = computed<SearchResult[]>(() => {
  const out: SearchResult[] = [];
  const allItems = appModel.getItems();
  const itemNames = appModel.getItemNames();

  // Create a map from AegisName to item for faster search
  const aegisMap = new Map<string, ItemDbEntry>();
  for (const itm of allItems) {
    aegisMap.set(itm.aegis_name, itm);
  }

  for (const combo of appModel.getCombos()) {
    const labelStr = combo.combos
      .map(c => c.items.map(a => appModel.getItemSearchName(a)).join('+'))
      .join(' / ');
    
    // Include item names and AegisNames in combos in search targets
    const searchTerms: string[] = [];
    for (const c of combo.combos) {
      for (const aegis of c.items) {
        searchTerms.push(aegis.toLowerCase());
        const itm = aegisMap.get(aegis);
        if (itm) {
          searchTerms.push(itm.name.toLowerCase());
          const jpName = itemNames.get(itm.id);
          if (jpName) searchTerms.push(jpName.toLowerCase());
        }
      }
    }

    out.push({
      key: `combo-${combo.filePath}-${combo.index}`,
      type: 'combo',
      label: `Combo: ${labelStr}`,
      _search: searchTerms.join(' '),
      combo,
    });
  }
  return out;
});

const allResults = computed<SearchResult[]>(() => [...allItemResults.value, ...allComboResults.value]);

const results = computed<SearchResult[]>(() => {
  const q = debouncedSearch.value?.trim().toLowerCase() || '';
  if (!q) return allResults.value;

  return allResults.value.filter(r => r._search.includes(q));
});

function isActive(r: SearchResult): boolean {
  if (r.type === 'item') return appModel.currentItem.value?.aegis_name === r.item?.aegis_name;
  if (r.type === 'combo') {
    const c = appModel.currentCombo.value;
    return !!(c && c.filePath === r.combo?.filePath && c.index === r.combo?.index);
  }
  return false;
}

function onSelect(r: SearchResult) {
  if (r.type === 'item' && r.item) appModel.loadItem(r.item.aegis_name);
  else if (r.type === 'combo' && r.combo) appModel.loadCombo(r.combo);
}

// ─── Context Menu ──────────────────────────────────────────────────────────
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  target: null as SearchResult | null,
});

function onContextMenu(e: MouseEvent, r: SearchResult) {
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.target = r;
  contextMenu.show = true;
  // Also select the item when right-clicked to load it in the editor
  onSelect(r);
}

function onCopy() {
  if (!contextMenu.target) return;
  if (contextMenu.target.type === 'item') {
    document.dispatchEvent(new CustomEvent('app:request-copy-item'));
  } else if (contextMenu.target.type === 'combo') {
    document.dispatchEvent(new CustomEvent('app:request-copy-combo'));
  }
}

function onDelete() {
  if (!contextMenu.target) return;
  if (contextMenu.target.type === 'item') {
    document.dispatchEvent(new CustomEvent('app:request-delete-item'));
  } else if (contextMenu.target.type === 'combo') {
    document.dispatchEvent(new CustomEvent('app:request-delete-combo'));
  }
}
</script>

<style scoped>
.search-panel { min-width: 0; }
.result-item { min-height: 36px; }
.item-row { border-left: 3px solid #1565c0; }
.combo-row { border-left: 3px solid #2e7d32; }
.chip-label { min-width: 18px; }
.result-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
