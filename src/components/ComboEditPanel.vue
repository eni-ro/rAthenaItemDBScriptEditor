<template>
  <div class="combo-edit-panel d-flex flex-column h-100 overflow-y-auto pa-3">
    <!-- New Combo Button -->
    <div class="d-flex align-center mb-3">
      <span class="text-subtitle-2 font-weight-bold">{{ isNew ? '新規コンボ作成' : 'コンボ編集' }}</span>
      <v-spacer />
      <v-btn size="small" color="primary" variant="tonal" @click="startNew">
        <v-icon size="small" class="mr-1">mdi-plus</v-icon> 新規作成
      </v-btn>
    </div>

    <div v-if="!combo && !isNew" class="text-grey text-caption d-flex align-center justify-center flex-grow-1">
      左の検索パネルからコンボを選択するか、「新規作成」をクリックしてください
    </div>

    <template v-else>
      <!-- Target File (new only) -->
      <div v-if="isNew" class="mb-3">
        <div class="text-caption font-weight-bold mb-1">保存先ファイル</div>
        <div class="d-flex align-center">
          <v-text-field
            v-model="targetFile"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="item_combos.yml のパス"
            class="text-caption flex-grow-1"
          />
          <v-btn icon="mdi-folder-open" size="small" variant="text" class="ml-1" @click="browseFile" />
        </div>
      </div>

      <!-- Combos List -->
      <div class="text-caption font-weight-bold mb-1">Combos (アイテムセット一覧)</div>
      <div v-for="(combo, ci) in form.combos" :key="ci" class="combo-block mb-2 pa-2 rounded border">
        <div class="d-flex align-center mb-1">
          <span class="text-caption text-grey">Combo {{ ci + 1 }}</span>
          <v-spacer />
          <v-btn size="x-small" icon="mdi-plus" variant="text" @click="addItemToCombo(ci)" title="アイテムを追加" />
          <v-btn size="x-small" icon="mdi-delete" variant="text" color="error" @click="removeCombo(ci)" title="このComboを削除" />
        </div>
        <div v-for="(aegis, ai) in combo.items" :key="ai" class="d-flex align-center mb-1">
          <v-chip size="small" variant="tonal" color="primary" class="mr-2 text-caption flex-grow-1">
            <span class="font-weight-bold">{{ getItemDisplayName(aegis) }}</span>
          </v-chip>
          <v-btn size="x-small" icon="mdi-close" variant="text" color="error" @click="removeItemFromCombo(ci, ai)" />
        </div>
        <div v-if="combo.items.length === 0" class="text-caption text-grey">アイテムが追加されていません</div>
      </div>

      <v-btn size="small" variant="tonal" class="mb-3" @click="addCombo">
        <v-icon size="small" class="mr-1">mdi-plus</v-icon> Combo セットを追加
      </v-btn>

      <v-divider class="my-2" />

      <!-- Script -->
      <div v-for="sf in SCRIPT_FIELDS" :key="sf.key" class="mb-2">
        <div class="d-flex align-center mb-1">
          <span class="text-caption font-weight-bold">{{ sf.label }}</span>
          <v-spacer />
          <v-btn size="x-small" variant="tonal" @click="openScriptEditor(sf.key)">
            <v-icon size="small" class="mr-1">mdi-pencil</v-icon> 詳細編集
          </v-btn>
        </div>
        <v-textarea
          v-model="form[sf.key as keyof typeof form] as string"
          density="compact"
          variant="outlined"
          hide-details
          rows="4"
          no-resize
          class="text-caption font-mono"
          :placeholder="`${sf.label} を入力...`"
        />
      </div>

      <!-- Actions -->
      <div class="d-flex justify-space-between mt-3">
        <v-btn v-if="!isNew && combo" color="error" variant="tonal" :loading="deleting" @click="onDeleteCombo">
          <v-icon class="mr-1">mdi-delete</v-icon> 削除
        </v-btn>
        <v-spacer />
        <v-chip v-if="isDirty" color="warning" size="small" class="mr-2">未保存の変更あり</v-chip>
        <v-btn color="success" variant="flat" :loading="saving" @click="save">
          <v-icon class="mr-1">mdi-content-save</v-icon> Save
        </v-btn>
      </div>
    </template>

    <!-- Item Select Dialog -->
    <ComboItemSelectDialog ref="itemSelectDialog" @select="onItemSelected" />
    <ScriptEditorDialog ref="scriptEditorDialog" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>

    <!-- 変更破棄確認 -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>変更を破棄しますか？</v-card-title>
        <v-card-text>現在のコンボに未保存の変更があります。破棄して移動しますか？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDialog.show = false; confirmDialog.cancel?.();">キャンセル</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDialog.show = false; confirmDialog.confirm?.();">破棄する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { useGlobals } from '../composables/useAppModel';
import ScriptEditorDialog from './ScriptEditorDialog.vue';
import ComboItemSelectDialog from './ComboItemSelectDialog.vue';
import { updateComboInYaml, addComboToYaml, deleteComboFromYaml } from '../lib/DbProcessor';
import { open as openFileDialog } from '@tauri-apps/plugin-dialog';
import type { ComboDbEntry } from '../lib/DbReader';

const appModel = useGlobals();
const scriptEditorDialog = ref<any>(null);
const itemSelectDialog = ref<any>(null);
const saving = ref(false);
const deleting = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });
const isNew = ref(false);
const targetFile = ref('');
const isDirty = ref(false);
const confirmDialog = reactive<{ show: boolean; confirm?: () => void; cancel?: () => void }>({ show: false });

const SCRIPT_FIELDS = [
  { key: 'script', label: 'Script' },
];

const combo = computed(() => appModel.currentCombo.value);

interface FormData {
  combos: { items: string[] }[];
  script: string;
}

const form = reactive<FormData>({ combos: [], script: '' });

// 追加先のcomboインデックス(どのComboにアイテム追加するか)
let addingToComboIdx = -1;

let _suppressDirty = false;

watch(combo, (newVal, oldVal) => {
  if (newVal) {
    if (isDirty.value && oldVal) {
      confirmDialog.confirm = () => {
        isNew.value = false;
        form.combos = newVal.combos.map(c => ({ items: [...c.items] }));
        form.script = newVal.script;
        targetFile.value = newVal.filePath;
        isDirty.value = false;
      };
      confirmDialog.cancel = () => { appModel.currentCombo.value = oldVal; };
      confirmDialog.show = true;
    } else {
      _suppressDirty = true;
      isNew.value = false;
      form.combos = newVal.combos.map(c => ({ items: [...c.items] }));
      form.script = newVal.script;
      targetFile.value = newVal.filePath;
      setTimeout(() => { isDirty.value = false; _suppressDirty = false; }, 50);
    }
  }
}, { deep: false });

watch(() => JSON.stringify(form), () => {
  if (!_suppressDirty) isDirty.value = true;
}, { deep: true });

function startNew() {
  isNew.value = true;
  appModel.currentCombo.value = null;
  form.combos = [{ items: [] }];
  form.script = '';
  // デフォルトの保存先は最初のItemCombosファイル
  const combos = appModel.getCombos();
  targetFile.value = combos.length > 0 ? combos[0].filePath : '';
}

function getItemDisplayName(aegis: string): string {
  return appModel.getItemSearchName(aegis);
}

function addCombo() {
  form.combos.push({ items: [] });
}

function removeCombo(ci: number) {
  form.combos.splice(ci, 1);
}

function removeItemFromCombo(ci: number, ai: number) {
  form.combos[ci].items.splice(ai, 1);
}

function addItemToCombo(ci: number) {
  addingToComboIdx = ci;
  itemSelectDialog.value?.open();
}

function onItemSelected(aegis_name: string) {
  if (addingToComboIdx >= 0 && addingToComboIdx < form.combos.length) {
    if (!form.combos[addingToComboIdx].items.includes(aegis_name)) {
      form.combos[addingToComboIdx].items.push(aegis_name);
    }
  }
}

async function browseFile() {
  try {
    const result = await openFileDialog({
      filters: [{ name: 'YAML files', extensions: ['yml', 'yaml'] }],
      multiple: false,
    });
    if (result) targetFile.value = typeof result === 'string' ? result : (result as any).path || '';
  } catch (e) {}
}

async function openScriptEditor(field: string) {
  const dialog = scriptEditorDialog.value;
  if (!dialog) return;
  const current = form[field as keyof typeof form] as string || '';
  const result = await dialog.open(current);
  if (result !== null) (form as any)[field] = result;
}

async function save() {
  const combosData = form.combos.map(c => c.items);
  saving.value = true;
  try {
    let result;
    if (isNew.value) {
      if (!targetFile.value) {
        snackbar.value = { show: true, text: '保存先ファイルを指定してください', color: 'error' };
        return;
      }
      result = await addComboToYaml(targetFile.value, combosData, form.script, appModel.getEncoding());
      if (result.success && result.index != null) {
        const newCombo: ComboDbEntry = {
          index: result.index,
          filePath: targetFile.value,
          combos: form.combos.map(c => ({ items: [...c.items] })),
          script: form.script,
        };
        appModel.addComboToMemory(newCombo);
        appModel.loadCombo(newCombo);
        isNew.value = false;
      }
    } else if (combo.value) {
      result = await updateComboInYaml(combo.value.filePath, combo.value.index, combosData, form.script, appModel.getEncoding());
      if (result.success) {
        const updated: ComboDbEntry = {
          ...combo.value,
          combos: form.combos.map(c => ({ items: [...c.items] })),
          script: form.script,
        };
        appModel.updateComboInMemory(updated);
        appModel.loadCombo(updated);
      }
    }

    if (result?.success) {
      isDirty.value = false;
      snackbar.value = { show: true, text: '保存しました', color: 'success' };
    } else {
      snackbar.value = { show: true, text: `Save failed: ${result?.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' };
  } finally {
    saving.value = false;
  }
}

async function onDeleteCombo() {
  if (!combo.value) return;
  if (!confirm('このコンボを削除しますか？')) return;
  deleting.value = true;
  try {
    const result = await deleteComboFromYaml(combo.value.filePath, combo.value.index, appModel.getEncoding());
    if (result.success) {
      appModel.deleteComboFromMemory(combo.value.filePath, combo.value.index);
      appModel.currentCombo.value = null;
      snackbar.value = { show: true, text: 'Deleted successfully', color: 'success' };
    } else {
      snackbar.value = { show: true, text: `Delete failed: ${result.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' };
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.combo-edit-panel { min-width: 0; }
.combo-block {
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.1);
}
.font-mono { font-family: 'Consolas', 'Monaco', monospace; }
</style>
