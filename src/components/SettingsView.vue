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
          設定は <strong>db.yml</strong> に保存されます。各パスは1行に1つ入力してください。
        </v-alert>

        <div v-for="section in sections" :key="section.key" class="mb-6">
          <div class="d-flex align-center mb-1">
            <span class="text-subtitle-2 font-weight-bold">{{ section.label }}</span>
            <span v-if="section.optional" class="text-caption text-grey ml-2">(任意)</span>
            <v-spacer />
            <v-btn size="x-small" variant="tonal" @click="addPath(section.key)">
              <v-icon size="small">mdi-plus</v-icon> 追加
            </v-btn>
          </div>
          <v-divider class="mb-2" />

          <div v-for="(path, idx) in localConfig[section.key]" :key="idx" class="d-flex align-center mb-1">
            <v-text-field
              v-model="localConfig[section.key][idx]"
              density="compact"
              variant="outlined"
              hide-details
              :placeholder="`${section.label} のファイルパス`"
              class="flex-grow-1 text-caption"
            />
            <v-btn
              icon="mdi-folder-open"
              size="small"
              variant="text"
              class="ml-1"
              @click="browsePath(section.key, idx)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              class="ml-1"
              @click="removePath(section.key, idx)"
            />
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
  Item: string[];
  ItemCombos: string[];
  ItemName: string[];
  Mob: string[];
  Skill: string[];
}

const sections = [
  { key: 'Item' as keyof DbConfig, label: 'Item DB', optional: false },
  { key: 'ItemCombos' as keyof DbConfig, label: 'Item Combos DB', optional: false },
  { key: 'ItemName' as keyof DbConfig, label: 'Item Name DB (検索名)', optional: true },
  { key: 'Mob' as keyof DbConfig, label: 'Mob DB', optional: true },
  { key: 'Skill' as keyof DbConfig, label: 'Skill DB', optional: true },
];

const dialog = ref(false);
const saving = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });

const localConfig = reactive<DbConfig>({
  Item: [],
  ItemCombos: [],
  ItemName: [],
  Mob: [],
  Skill: [],
});

let dbYmlPath = '';

function open(currentConfig: DbConfig, ymlPath: string) {
  dbYmlPath = ymlPath;
  Object.assign(localConfig, {
    Item: [...(currentConfig.Item || [])],
    ItemCombos: [...(currentConfig.ItemCombos || [])],
    ItemName: [...(currentConfig.ItemName || [])],
    Mob: [...(currentConfig.Mob || [])],
    Skill: [...(currentConfig.Skill || [])],
  });
  dialog.value = true;
}

function addPath(key: keyof DbConfig) {
  localConfig[key].push('');
}

function removePath(key: keyof DbConfig, idx: number) {
  localConfig[key].splice(idx, 1);
}

async function browsePath(key: keyof DbConfig, idx: number) {
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
    snackbar.value = { show: true, text: 'db.yml のパスが不明です', color: 'error' };
    return;
  }
  saving.value = true;
  try {
    const config: Record<string, string[]> = {};
    for (const s of sections) {
      const paths = localConfig[s.key].filter(p => p.trim());
      config[s.key] = paths;
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
