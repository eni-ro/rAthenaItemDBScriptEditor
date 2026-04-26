<template>
  <div class="search-panel d-flex flex-column h-100">
    <!-- Search Box -->
    <div class="pa-2 border-b flex-shrink-0">
      <v-text-field
        v-model="rawSearch"
        append-inner-icon="mdi-magnify"
        label="Search (AegisName / Name / 検索名)"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        class="text-caption"
      />
      <div class="text-caption text-grey mt-1 px-1">
        {{ results.length }} 件
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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

// 事前にアイテム一覧を構築（起動後固定）
const allItemResults = computed<SearchResult[]>(() => {
  return appModel.getItems().map(item => ({
    key: `item-${item.aegis_name}`,
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

  // AegisNameからアイテムへのマップを作成して検索を高速化
  const aegisMap = new Map<string, ItemDbEntry>();
  for (const itm of allItems) {
    aegisMap.set(itm.aegis_name, itm);
  }

  for (const combo of appModel.getCombos()) {
    const labelStr = combo.combos
      .map(c => c.items.map(a => appModel.getItemSearchName(a)).join('+'))
      .join(' / ');
    
    // コンボ内のアイテム名やAegisNameも含めて検索対象にする
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
