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

        <!-- DivinePride Settings -->
        <div class="mb-5">
          <div class="text-subtitle-2 font-weight-bold mb-1">DivinePride API Settings</div>
          <v-divider class="mb-2" />
          <v-text-field
            v-model="localConfig.DivinePrideKey"
            label="API Key"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="Enter your DivinePride API Key"
            class="mb-2"
          />
          <div class="text-caption text-grey">
            Required for fetching item data from <a href="https://www.divine-pride.net/" target="_blank" class="text-primary">DivinePride</a>.
          </div>
          <v-checkbox
            v-model="localConfig.EnableFuzzyDivinePride"
            label="Enable Fuzzy Auto-complete (DivinePride description parsing)"
            density="compact"
            hide-details
            class="mt-1"
          />
          <div class="text-caption text-grey ml-7">
            Automatically fill Weapon/Armor Level and default Range by parsing the description or based on item type.
          </div>

          <div class="mt-3 ml-7">
            <div class="text-caption font-weight-bold mb-1">Range Data Source</div>
            <v-radio-group v-model="localConfig.DivinePrideRangeSource" density="compact" hide-details direction="horizontal">
              <v-radio label="API Response" value="api" />
              <v-radio label="SubType Defaults (Fuzzy)" value="fuzzy" />
            </v-radio-group>
            <div class="text-caption text-grey mt-1">
              Choose whether to use the range from DivinePride API or set defaults based on weapon type.
            </div>
          </div>
        </div>

        <!-- Combo Settings -->
        <div class="mb-5">
          <div class="text-subtitle-2 font-weight-bold mb-1">Item Combo Settings</div>
          <v-divider class="mb-2" />
          <v-checkbox
            v-model="localConfig.ShowComboComments"
            label="Append ID and Name comments to AegisName in YAML"
            density="compact"
            hide-details
            class="mt-n1"
          />
          <div class="text-caption text-grey mt-1">
            When saving a combo, automatically adds comments like <code># 501: Red_Potion</code> next to item names.
          </div>
        </div>

        <!-- Sorting Settings -->
        <div class="mb-5">
          <div class="text-subtitle-2 font-weight-bold mb-1">Item Insertion & Sorting Settings</div>
          <v-divider class="mb-2" />
          <v-checkbox
            v-model="localConfig.SortOnInsert"
            label="Sort items by ID on insertion (New Items)"
            density="compact"
            hide-details
            class="mt-n1"
          />
          <v-checkbox
            v-model="localConfig.SortOnUpdate"
            label="Re-sort item by ID on update (Overwrite)"
            density="compact"
            hide-details
            class="mt-n1"
          />
          <div class="text-caption text-grey mt-1">
            Determines whether items are moved to their correct position based on ID when saving.
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
import { useGlobals } from '../composables/useAppModel';

const appModel = useGlobals();

interface DbConfig {
  TypeScriptEncoding: string;
  PythonEncoding: string;
  RustEncoding: string;
  Encoding?: string;
  Item: string[];
  ItemCombos: string[];
  ItemName: string[];
  Mob: string[];
  Skill: string[];
  DivinePrideKey?: string;
  SortOnInsert?: boolean;
  SortOnUpdate?: boolean;
  EnableFuzzyDivinePride?: boolean;
  DivinePrideRangeSource?: 'api' | 'fuzzy';
  ShowComboComments?: boolean;
}

type DbPathKey = 'Item' | 'ItemCombos' | 'ItemName' | 'Mob' | 'Skill';

const ENCODING_GROUPS = [
  { label: 'UTF-8 (Standard)', ts: 'utf-8', py: 'utf-8', rust: 'utf-8' },
  { label: 'Default (1252 - Western European)', ts: 'windows-1252', py: 'cp1252', rust: 'windows-1252' },
  { label: 'Korean (949)', ts: 'euc-kr', py: 'cp949', rust: 'euc-kr' },
  { label: 'Cyrillic (1251)', ts: 'windows-1251', py: 'cp1251', rust: 'windows-1251' },
  { label: 'Japanese (932)', ts: 'shift-jis', py: 'cp932', rust: 'shift-jis' },
  { label: 'Chinese Simplified (936 - GB2312)', ts: 'gbk', py: 'cp936', rust: 'gbk' },
  { label: 'Other...', ts: '', py: '', rust: '' },
];

const sections: { key: DbPathKey; label: string; optional: boolean }[] = [
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
  DivinePrideKey: '',
  SortOnInsert: true,
  SortOnUpdate: false,
  EnableFuzzyDivinePride: false,
  DivinePrideRangeSource: 'api',
  ShowComboComments: true,
});

let dbYmlPath = '';

function open(currentConfig: Partial<DbConfig>, ymlPath: string) {
  dbYmlPath = ymlPath;
  const baseEnc = currentConfig.TypeScriptEncoding || currentConfig.PythonEncoding || currentConfig.RustEncoding || currentConfig.Encoding || 'utf-8';
  
  Object.assign(localConfig, {
    TypeScriptEncoding: (currentConfig.TypeScriptEncoding || currentConfig.Encoding || baseEnc).toLowerCase(),
    PythonEncoding: (currentConfig.PythonEncoding || currentConfig.Encoding || baseEnc).toLowerCase(),
    RustEncoding: (currentConfig.RustEncoding || currentConfig.Encoding || baseEnc).toLowerCase(),
    Item: [...(currentConfig.Item || [])],
    ItemCombos: [...(currentConfig.ItemCombos || [])],
    ItemName: [...(currentConfig.ItemName || [])],
    Mob: [...(currentConfig.Mob || [])],
    Skill: [...(currentConfig.Skill || [])],
    DivinePrideKey: currentConfig.DivinePrideKey || '',
    SortOnInsert: currentConfig.SortOnInsert !== false,
    SortOnUpdate: currentConfig.SortOnUpdate === true,
    EnableFuzzyDivinePride: currentConfig.EnableFuzzyDivinePride === true,
    DivinePrideRangeSource: currentConfig.DivinePrideRangeSource || 'api',
    ShowComboComments: currentConfig.ShowComboComments !== false,
  });

  // Determine current group
  const group = ENCODING_GROUPS.find(g => 
    g.label !== 'Other...' &&
    g.ts.toLowerCase() === localConfig.TypeScriptEncoding &&
    g.py.toLowerCase() === localConfig.PythonEncoding &&
    g.rust.toLowerCase() === localConfig.RustEncoding
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

function addPath(key: DbPathKey) {
  localConfig[key].push('');
}

function removePath(key: DbPathKey, idx: number) {
  localConfig[key].splice(idx, 1);
}

async function browsePath(key: DbPathKey, idx: number) {
  try {
    const result = await openFileDialog({
      filters: [{ name: 'YAML files', extensions: ['yml', 'yaml'] }],
      multiple: false,
    });
    if (result) {
      localConfig[key][idx] = typeof result === 'string' ? result : (result as any).path || '';
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
      DivinePrideKey: localConfig.DivinePrideKey,
      SortOnInsert: localConfig.SortOnInsert,
      SortOnUpdate: localConfig.SortOnUpdate,
      EnableFuzzyDivinePride: localConfig.EnableFuzzyDivinePride,
      DivinePrideRangeSource: localConfig.DivinePrideRangeSource,
      ShowComboComments: localConfig.ShowComboComments,
    };
    for (const s of sections) {
      config[s.key] = (localConfig[s.key] as string[]).filter(p => p.trim());
    }
    const result = await updateDbYml(dbYmlPath, config);
    if (result.success) {
      appModel.refreshSettings();
      snackbar.value = { show: true, text: 'Settings saved and applied.', color: 'success' };
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
