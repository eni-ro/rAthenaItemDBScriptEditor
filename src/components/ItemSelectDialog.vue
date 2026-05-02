<template>
  <v-dialog v-model="dialog" max-width="800" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white py-2">
        <span class="text-h6">Select Item</span>
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="dialog = false"
        ></v-btn>
      </v-card-title>

      <v-card-text class="pa-0 d-flex flex-column h-100">
        <div class="pa-2">
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Search by AegisName or Name"
            single-line
            hide-details
            density="compact"
            variant="outlined"
          ></v-text-field>
        </div>

        <v-divider></v-divider>

        <v-data-table-virtual
          :headers="headers"
          :items="filteredItems"
          density="compact"
          hover
          class="flex-grow-1"
          height="500"
          @click:row="onRowClick"
        >
        </v-data-table-virtual>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useGlobals } from "../composables/useAppModel";

const dialog = ref(false);
const search = ref("");
const debouncedSearch = ref("");
const appModel = useGlobals();

// Search debounce
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val || "";
  }, 200);
});

const headers = [
  { title: "AegisName", key: "aegis_name", sortable: true },
  { title: "Name", key: "name", sortable: true },
];

let onSelectCallback: ((aegis_name: string, filePath: string) => void) | null = null;

// Pre-build search target strings
const allItems = computed(() => {
  const items = appModel.getItems();
  const itemNames = appModel.getItemNames();
  return items.map((item) => ({
    ...item,
    _search: (
      item.aegis_name +
      " " +
      item.name +
      " " +
      (itemNames.get(item.id) || "")
    ).toLowerCase(),
  }));
});

const filteredItems = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase();
  if (!q) return allItems.value;
  return allItems.value.filter((item) => item._search.includes(q));
});

const openDialog = (onSelect: (aegis_name: string, filePath: string) => void) => {
  onSelectCallback = onSelect;
  search.value = "";
  debouncedSearch.value = "";
  dialog.value = true;
};

const onRowClick = (_event: Event, { item }: any) => {
  if (onSelectCallback && item && item.aegis_name) {
    onSelectCallback(item.aegis_name, item.filePath);
  }
  dialog.value = false;
};

defineExpose({
  openDialog,
});
</script>
