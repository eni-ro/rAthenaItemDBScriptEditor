<template>
  <v-dialog v-model="dialog" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white py-2">
        <span class="text-h6">Select Item for Combo</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
      </v-card-title>

      <v-card-text class="pa-0 d-flex flex-column">
        <div class="pa-2">
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Search by AegisName / Name / SearchName"
            single-line
            hide-details
            density="compact"
            variant="outlined"
          />
        </div>
        <v-divider />
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
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGlobals } from '../composables/useAppModel';

const emit = defineEmits<{ (e: 'select', aegis_name: string): void }>();

const appModel = useGlobals();
const dialog = ref(false);
const search = ref('');

const headers = [
  { title: 'AegisName', key: 'aegis_name', sortable: true },
  { title: 'Name / SearchName', key: 'displayName', sortable: true },
];

const filteredItems = computed(() => {
  return appModel.getItems().map(item => ({
    aegis_name: item.aegis_name,
    displayName: appModel.getDisplayName(item),
  })).filter(item => {
    if (!search.value) return true;
    const q = search.value.toLowerCase();
    return item.aegis_name.toLowerCase().includes(q) || item.displayName.toLowerCase().includes(q);
  });
});

function open() {
  search.value = '';
  dialog.value = true;
}

function onRowClick(_e: Event, row: any) {
  if (row.item?.aegis_name) {
    emit('select', row.item.aegis_name);
    dialog.value = false;
  }
}

defineExpose({ open });
</script>
