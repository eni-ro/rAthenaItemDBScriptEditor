<template>
  <v-dialog v-model="dialog" max-width="800" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center bg-grey-darken-3 py-2">
        <v-icon class="mr-2">mdi-cog</v-icon>
        <span>Settings - DB Paths</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
      </v-card-title>

      <v-card-text class="pa-4">
        <v-alert type="info" density="compact" class="mb-4" variant="tonal">
          Settings are saved in <strong>db.yml</strong>. Changes will take effect after restart.
        </v-alert>

        <!-- Encodings -->
        <div class="mb-5">
          <div class="text-subtitle-2 font-weight-bold mb-1">File Encoding Settings</div>
          <v-divider class="mb-2" />
          
          <v-select
            v-model="selectedGroup"
            :items="ENCODING_GROUPS"
            item-title="label"
            return-object
            label="Standard Encoding Preset"
            density="compact"
            variant="outlined"
            class="mb-3"
            hide-details
            @update:model-value="onGroupChange"
          />

          <v-expand-transition>
            <v-row v-if="selectedGroup.label === 'Other...'" dense>
              <v-col cols="4">
                <v-text-field
                  v-model="localConfig.TypeScriptEncoding"
                  label="TypeScript (Frontend)"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-2"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="localConfig.PythonEncoding"
                  label="Python (Processor)"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-2"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="localConfig.RustEncoding"
                  label="Rust (Backend)"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" class="mt-n2">
                <div class="text-caption text-grey">
                  Input specific encoding labels for each environment.
                </div>
              </v-col>
            </v-row>
          </v-expand-transition>
          
          <div class="text-caption text-grey mt-1">
            Applied to Item, ItemCombos, ItemName, Mob, and Skill YAML files. db.yml itself is always UTF-8.
          </div>
        </div>

        <!-- Path Sections -->
        <div v-for="section in sections" :key="section.key" class="mb-5">
          <div class="d-flex align-center mb-1">
            <span class="text-subtitle-2 font-weight-bold">{{ section.label }}</span>
            <span v-if="section.optional" class="text-caption text-grey ml-2">(Optional)</span>
            <v-spacer />
            <v-btn size="x-small" variant="tonal" @click="addPath(section.key)">
              <v-icon size="small">mdi-plus</v-icon> Add
            </v-btn>
          </div>
          <v-divider class="mb-2" />

          <div v-for="(_, idx) in localConfig[section.key]" :key="idx" class="d-flex align-center mb-1">
            <v-text-field
              v-model="localConfig[section.key][idx]"
              density="compact"
              variant="outlined"
              hide-details
              :placeholder="`path to ${section.label}`"
              class="flex-grow-1 text-caption"
            />
            <v-btn icon="mdi-folder-open" size="small" variant="text" class="ml-1" @click="browsePath(section.key, idx)" />
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" class="ml-1" @click="removePath(section.key, idx)" />
          </div>
          <div v-if="localConfig[section.key].length === 0" class="text-caption text-grey">
            No paths configured
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { open as openFileDialog } from '@tauri-apps/plugin-dialog';
import { updateDbYml } from '../lib/DbProcessor';

interface DbConfig {
  TypeScriptEncoding: string;
  PythonEncoding: string;
  RustEncoding: string;
  Item: string[];
  ItemCombos: string[];
  ItemName: string[];
  Mob: string[];
  Skill: string[];
}

const ENCODING_GROUPS = [
  { label: 'UTF-8 (Standard)', ts: 'utf-8', py: 'utf-8', rust: 'utf-8' },
  { label: 'Default (1252 - Western European)', ts: 'windows-1252', py: 'cp1252', rust: 'windows-1252' },
  { label: 'Korean (949)', ts: 'euc-kr', py: 'cp949', rust: 'euc-kr' },
  { label: 'Cyrillic (1251)', ts: 'windows-1251', py: 'cp1251', rust: 'windows-1251' },
  { label: 'Japanese (932)', ts: 'shift-jis', py: 'cp932', rust: 'shift-jis' },
  { label: 'Chinese Simplified (936 - GB2312)', ts: 'gbk', py: 'cp936', rust: 'gbk' },
  { label: 'Other...', ts: '', py: '', rust: '' },
];

const sections: { key: keyof DbConfig; label: string; optional: boolean }[] = [
  { key: 'Item', label: 'Item DB', optional: false },
  { key: 'ItemCombos', label: 'Item Combos DB', optional: false },
  { key: 'ItemName', label: 'Item Name DB (Search Name)', optional: true },
  { key: 'Mob', label: 'Mob DB', optional: true },
  { key: 'Skill', label: 'Skill DB', optional: true },
];

const dialog = ref(false);
const saving = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });
const selectedGroup = ref(ENCODING_GROUPS[0]);

const localConfig = reactive<DbConfig>({
  TypeScriptEncoding: 'utf-8',
  PythonEncoding: 'utf-8',
  RustEncoding: 'utf-8',
  Item: [],
  ItemCombos: [],
  ItemName: [],
  Mob: [],
  Skill: [],
});

let dbYmlPath = '';

function open(currentConfig: Partial<DbConfig>, ymlPath: string) {
  dbYmlPath = ymlPath;
  const baseEnc = currentConfig.TypeScriptEncoding || (currentConfig as any).Encoding || 'utf-8';
  Object.assign(localConfig, {
    TypeScriptEncoding: currentConfig.TypeScriptEncoding || baseEnc,
    PythonEncoding: currentConfig.PythonEncoding || (currentConfig as any).Encoding || baseEnc,
    RustEncoding: currentConfig.RustEncoding || (currentConfig as any).Encoding || baseEnc,
    Item: [...(currentConfig.Item || [])],
    ItemCombos: [...(currentConfig.ItemCombos || [])],
    ItemName: [...(currentConfig.ItemName || [])],
    Mob: [...(currentConfig.Mob || [])],
    Skill: [...(currentConfig.Skill || [])],
  });

  // Determine current group
  const group = ENCODING_GROUPS.find(g => 
    g.label !== 'Other...' &&
    g.ts === localConfig.TypeScriptEncoding &&
    g.py === localConfig.PythonEncoding &&
    g.rust === localConfig.RustEncoding
  );
  selectedGroup.value = group || ENCODING_GROUPS.find(g => g.label === 'Other...')!;

  dialog.value = true;
}

function onGroupChange(group: typeof ENCODING_GROUPS[0]) {
  if (group.label !== 'Other...') {
    localConfig.TypeScriptEncoding = group.ts;
    localConfig.PythonEncoding = group.py;
    localConfig.RustEncoding = group.rust;
  }
}

function addPath(key: keyof DbConfig) {
  if (key.includes('Encoding')) return;
  (localConfig[key] as string[]).push('');
}

function removePath(key: keyof DbConfig, idx: number) {
  if (key.includes('Encoding')) return;
  (localConfig[key] as string[]).splice(idx, 1);
}

async function browsePath(key: keyof DbConfig, idx: number) {
  if (key.includes('Encoding')) return;
  try {
    const result = await openFileDialog({
      filters: [{ name: 'YAML files', extensions: ['yml', 'yaml'] }],
      multiple: false,
    });
    if (result) {
      (localConfig[key] as string[])[idx] = typeof result === 'string' ? result : (result as any).path || '';
    }
  } catch (e) {
    console.warn('Failed to open file dialog', e);
  }
}

async function save() {
  if (!dbYmlPath) {
    snackbar.value = { show: true, text: 'Path to db.yml is unknown', color: 'error' };
    return;
  }
  saving.value = true;
  try {
    const config: Record<string, any> = {
      TypeScriptEncoding: localConfig.TypeScriptEncoding,
      PythonEncoding: localConfig.PythonEncoding,
      RustEncoding: localConfig.RustEncoding,
    };
    for (const s of sections) {
      config[s.key] = (localConfig[s.key] as string[]).filter(p => p.trim());
    }
    const result = await updateDbYml(dbYmlPath, config);
    if (result.success) {
      snackbar.value = { show: true, text: 'Settings saved. Changes will take effect after restart.', color: 'success' };
      dialog.value = false;
    } else {
      snackbar.value = { show: true, text: `Failed to save: ${result.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' };
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>
