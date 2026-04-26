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
          設定は <strong>db.yml</strong> に保存されます。再起動後に反映されます。
        </v-alert>

        <!-- Encoding -->
        <div class="mb-5">
          <div class="text-subtitle-2 font-weight-bold mb-1">ファイルエンコーディング</div>
          <v-divider class="mb-2" />
          <v-row dense>
            <v-col cols="4">
              <v-select
                v-model="localConfig.Encoding"
                :items="ENCODING_OPTIONS"
                item-title="label"
                item-value="value"
                label="Encoding"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="8" class="d-flex align-center">
              <span class="text-caption text-grey">
                Item / ItemCombos / ItemName / Mob / Skill の各YAMLファイルに適用されます。db.yml自体は常にUTF-8です。
              </span>
            </v-col>
          </v-row>
        </div>

        <!-- Path Sections -->
        <div v-for="section in sections" :key="section.key" class="mb-5">
          <div class="d-flex align-center mb-1">
            <span class="text-subtitle-2 font-weight-bold">{{ section.label }}</span>
            <span v-if="section.optional" class="text-caption text-grey ml-2">(任意)</span>
            <v-spacer />
            <v-btn size="x-small" variant="tonal" @click="addPath(section.key)">
              <v-icon size="small">mdi-plus</v-icon> 追加
            </v-btn>
          </div>
          <v-divider class="mb-2" />

          <div v-for="(_, idx) in localConfig[section.key]" :key="idx" class="d-flex align-center mb-1">
            <v-text-field
              v-model="localConfig[section.key][idx]"
              density="compact"
              variant="outlined"
              hide-details
              :placeholder="`${section.label} のファイルパス`"
              class="flex-grow-1 text-caption"
            />
            <v-btn icon="mdi-folder-open" size="small" variant="text" class="ml-1" @click="browsePath(section.key, idx)" />
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" class="ml-1" @click="removePath(section.key, idx)" />
          </div>
          <div v-if="localConfig[section.key].length === 0" class="text-caption text-grey">
            パスが設定されていません
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">キャンセル</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">保存</v-btn>
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
  Encoding: string;
  Item: string[];
  ItemCombos: string[];
  ItemName: string[];
  Mob: string[];
  Skill: string[];
}

const ENCODING_OPTIONS = [
  { label: 'UTF-8', value: 'utf-8' },
  { label: 'Shift-JIS (CP932)', value: 'shift-jis' },
  { label: 'EUC-JP', value: 'euc-jp' },
];

const sections: { key: keyof DbConfig; label: string; optional: boolean }[] = [
  { key: 'Item', label: 'Item DB', optional: false },
  { key: 'ItemCombos', label: 'Item Combos DB', optional: false },
  { key: 'ItemName', label: 'Item Name DB (検索名)', optional: true },
  { key: 'Mob', label: 'Mob DB', optional: true },
  { key: 'Skill', label: 'Skill DB', optional: true },
];

const dialog = ref(false);
const saving = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });

const localConfig = reactive<DbConfig>({
  Encoding: 'utf-8',
  Item: [],
  ItemCombos: [],
  ItemName: [],
  Mob: [],
  Skill: [],
});

let dbYmlPath = '';

function open(currentConfig: Partial<DbConfig>, ymlPath: string) {
  dbYmlPath = ymlPath;
  Object.assign(localConfig, {
    Encoding: currentConfig.Encoding || 'utf-8',
    Item: [...(currentConfig.Item || [])],
    ItemCombos: [...(currentConfig.ItemCombos || [])],
    ItemName: [...(currentConfig.ItemName || [])],
    Mob: [...(currentConfig.Mob || [])],
    Skill: [...(currentConfig.Skill || [])],
  });
  dialog.value = true;
}

function addPath(key: keyof DbConfig) {
  if (key === 'Encoding') return;
  (localConfig[key] as string[]).push('');
}

function removePath(key: keyof DbConfig, idx: number) {
  if (key === 'Encoding') return;
  (localConfig[key] as string[]).splice(idx, 1);
}

async function browsePath(key: keyof DbConfig, idx: number) {
  if (key === 'Encoding') return;
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
    snackbar.value = { show: true, text: 'db.yml のパスが不明です', color: 'error' };
    return;
  }
  saving.value = true;
  try {
    const config: Record<string, any> = { Encoding: localConfig.Encoding };
    for (const s of sections) {
      config[s.key] = (localConfig[s.key] as string[]).filter(p => p.trim());
    }
    const result = await updateDbYml(dbYmlPath, config);
    if (result.success) {
      snackbar.value = { show: true, text: '保存しました。再起動で反映されます。', color: 'success' };
      dialog.value = false;
    } else {
      snackbar.value = { show: true, text: `保存失敗: ${result.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `エラー: ${e.message}`, color: 'error' };
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>
