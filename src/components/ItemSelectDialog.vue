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

        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :search="search"
          :items-per-page="50"
          density="compact"
          hover
          class="flex-grow-1"
          style="overflow-y: auto; max-height: 500px"
          @click:row="onRowClick"
        >
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useGlobals } from "../composables/useAppModel";

const dialog = ref(false);
const search = ref("");
const appModel = useGlobals();

const headers = [
  { title: "AegisName", key: "aegis_name", sortable: true },
  { title: "Name", key: "name", sortable: true },
];

let onSelectCallback: ((aegis_name: string) => void) | null = null;

const filteredItems = computed(() => {
  const allItems = appModel.getItems();
  if (!search.value) return allItems;
  const lower = search.value.toLowerCase();
  return allItems.filter(
    (item) =>
      item.aegis_name.includes(lower) ||
      item.name.toLowerCase().includes(lower),
  );
});

const openDialog = (onSelect: (aegis_name: string) => void) => {
  onSelectCallback = onSelect;
  search.value = "";
  dialog.value = true;
};

const onRowClick = (_event: Event, item: any) => {
  if (onSelectCallback && item.item && item.item.aegis_name) {
    onSelectCallback(item.item.aegis_name);
  }
  dialog.value = false;
};

defineExpose({
  openDialog,
});
</script>
