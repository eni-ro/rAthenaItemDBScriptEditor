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
        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :search="search"
          :items-per-page="-1"
          density="compact"
          hover
          class="flex-grow-1"
          style="overflow-y: auto; max-height: 400px;"
          @click:row="onRowClick"
        >
          <!-- Hide default footer to show all items -->
          <template v-slot:bottom></template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const dialog = ref(false);
const search = ref('');

const headers = [
  { title: 'Value', key: 'value', sortable: true },
  { title: 'Description', key: 'desc', sortable: true }
];

const listItems = ref<{ value: string, desc: string }[]>([]);

let currentCallback: ((val: string) => void) | null = null;

const filteredItems = computed(() => {
  if (!search.value) return listItems.value;
  const lower = search.value.toLowerCase();
  return listItems.value.filter(item => 
    item.value.toLowerCase().includes(lower) || 
    item.desc.toLowerCase().includes(lower)
  );
});

export interface ParamSelectOptions {
  items: { value: string, desc: string }[];
  onSelect: (val: string) => void;
}

const openDialog = (options: ParamSelectOptions) => {
  listItems.value = options.items;
  currentCallback = options.onSelect;
  search.value = '';
  dialog.value = true;
};

const close = () => {
  dialog.value = false;
  currentCallback = null;
};

const onRowClick = (_event: Event, item: any) => {
  if (currentCallback) {
    currentCallback(item.item.value);
  }
  close();
};

defineExpose({
  openDialog
});
</script>
