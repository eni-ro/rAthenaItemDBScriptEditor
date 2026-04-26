<template>
  <v-dialog v-model="dialog" max-width="600" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white py-2">
        <span class="text-h6">Select Parameter</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>
      
      <v-card-text class="pa-0 d-flex flex-column h-100">
        <div class="pa-2">
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            density="compact"
            variant="outlined"
          ></v-text-field>
        </div>
        
        <v-divider></v-divider>
        
        <!-- Table view for the list -->
        <v-data-table-virtual
          :headers="headers"
          :items="filteredItems"
          density="compact"
          hover
          class="flex-grow-1"
          height="400"
          @click:row="onRowClick"
        >
        </v-data-table-virtual>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const dialog = ref(false);
const search = ref('');
const debouncedSearch = ref('');

// 検索のデバウンス
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val || '';
  }, 200);
});

const headers = [
  { title: 'Value', key: 'value', sortable: true },
  { title: 'Description', key: 'desc', sortable: true }
];

const listItems = ref<{ value: string, desc: string }[]>([]);

let currentCallback: ((val: string) => void) | null = null;

// 検索対象の文字列を事前に構築
const allItems = computed(() => {
  return listItems.value.map(item => ({
    ...item,
    _search: (item.value + ' ' + item.desc).toLowerCase()
  }));
});

const filteredItems = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase();
  if (!q) return allItems.value;
  return allItems.value.filter(item => item._search.includes(q));
});

export interface ParamSelectOptions {
  items: { value: string, desc: string }[];
  onSelect: (val: string) => void;
}

const openDialog = (options: ParamSelectOptions) => {
  listItems.value = options.items;
  currentCallback = options.onSelect;
  search.value = '';
  debouncedSearch.value = '';
  dialog.value = true;
};

const close = () => {
  dialog.value = false;
  currentCallback = null;
};

const onRowClick = (_event: Event, { item }: any) => {
  if (currentCallback && item && item.value) {
    currentCallback(item.value);
  }
  close();
};

defineExpose({
  openDialog
});
</script>
