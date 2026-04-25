<template>
  <div class="search-panel d-flex flex-column h-100">
    <!-- Search Box -->
    <div class="pa-2 border-b">
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Search (AegisName / Name / 検索名)"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        class="text-caption"
      />
    </div>

    <!-- Result List -->
    <div class="flex-grow-1 overflow-y-auto">
      <v-list density="compact" class="pa-0">
        <template v-if="results.length === 0 && search">
          <v-list-item>
            <v-list-item-title class="text-caption text-grey">結果なし</v-list-item-title>
          </v-list-item>
        </template>

        <template v-for="r in results" :key="r.key">
          <v-list-item
            :class="['text-caption', r.type === 'item' ? 'item-row' : 'combo-row']"
            @click="onSelect(r)"
            :active="isActive(r)"
            active-color="primary"
          >
            <template #prepend>
              <v-chip
                :color="r.type === 'item' ? 'blue-darken-1' : 'green-darken-1'"
                size="x-small"
                variant="flat"
                class="mr-2"
                label
              >
                {{ r.type === 'item' ? 'Item' : 'Combo' }}
              </v-chip>
            </template>
            <v-list-item-title class="text-caption text-truncate">{{ r.label }}</v-list-item-title>
          </v-list-item>
          <v-divider />
        </template>
      </v-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGlobals } from '../composables/useAppModel';
import type { ItemDbEntry, ComboDbEntry } from '../lib/DbReader';

const appModel = useGlobals();
const search = ref('');

interface SearchResult {
  key: string;
  type: 'item' | 'combo';
  label: string;
  item?: ItemDbEntry;
  combo?: ComboDbEntry;
  /** コンボの場合、当該Combo (アイテムリスト) のインデックス */
  comboInnerIdx?: number;
}

const results = computed<SearchResult[]>(() => {
  const q = search.value?.trim().toLowerCase() || '';
  const out: SearchResult[] = [];

  // ─── Item ─────────────────────────────────────────────────────
  for (const item of appModel.getItems()) {
    if (!q) { out.push(makeItemResult(item)); continue; }

    const jpName = appModel.getItemNames().get(item.id)?.toLowerCase() || '';
    if (
      item.aegis_name.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      jpName.includes(q)
    ) {
      out.push(makeItemResult(item));
    }
  }

  // ─── Combo ────────────────────────────────────────────────────
  for (const combo of appModel.getCombos()) {
    // Combos ブロック内の各 Combo を個別にチェック
    combo.combos.forEach((c, innerIdx) => {
      const itemNames = c.items.map(aegis => appModel.getItemSearchName(aegis));
      const labelStr = itemNames.join('-');

      if (!q || c.items.some(aegis => {
        const itm = appModel.getItems().find(i => i.aegis_name === aegis);
        if (!itm) return aegis.toLowerCase().includes(q);
        const jp = appModel.getItemNames().get(itm.id)?.toLowerCase() || '';
        return aegis.toLowerCase().includes(q) || itm.name.toLowerCase().includes(q) || jp.includes(q);
      })) {
        out.push({
          key: `combo-${combo.filePath}-${combo.index}-${innerIdx}`,
          type: 'combo',
          label: `Combo: ${labelStr}`,
          combo,
          comboInnerIdx: innerIdx,
        });
      }
    });
  }

  return q ? out : out.slice(0, 200); // 未検索時は先頭200件
});

function makeItemResult(item: ItemDbEntry): SearchResult {
  const displayName = appModel.getDisplayName(item);
  return {
    key: `item-${item.aegis_name}`,
    type: 'item',
    label: `Item: ${displayName}`,
    item,
  };
}

function isActive(r: SearchResult): boolean {
  if (r.type === 'item') return appModel.currentItem.value?.aegis_name === r.item?.aegis_name;
  if (r.type === 'combo') {
    const c = appModel.currentCombo.value;
    return !!(c && c.filePath === r.combo?.filePath && c.index === r.combo?.index);
  }
  return false;
}

function onSelect(r: SearchResult) {
  if (r.type === 'item' && r.item) {
    appModel.loadItem(r.item.aegis_name);
  } else if (r.type === 'combo' && r.combo) {
    appModel.loadCombo(r.combo);
  }
}
</script>

<style scoped>
.search-panel {
  min-width: 0;
}
.item-row {
  border-left: 3px solid #1565c0;
}
.combo-row {
  border-left: 3px solid #2e7d32;
}
</style>
