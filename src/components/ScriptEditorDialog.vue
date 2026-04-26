<template>
  <v-dialog v-model="dialog" fullscreen :scrim="false" transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column h-100">
      <!-- Header -->
      <v-toolbar color="grey-darken-3" density="compact">
        <v-toolbar-title>Script Editor</v-toolbar-title>
        <v-spacer />
        <v-btn color="success" variant="flat" class="mr-2" @click="onConfirm">確定</v-btn>
        <v-btn variant="text" icon="mdi-close" @click="onCancel" />
      </v-toolbar>

      <div class="editor-layout flex-grow-1" ref="containerRef">
        <!-- Left: Built-in script selector -->
        <div class="pane-left border-e" ref="leftRef">
          <div class="left-pane-grid">
            <!-- Top: Script list -->
            <div class="grid-top border-b">
              <div class="pa-1 bg-grey-lighten-4 d-flex align-center position-sticky top-0" style="z-index:10">
                <v-text-field
                  v-model="scriptSearch"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  hide-details
                  label="Search Scripts"
                  variant="outlined"
                  class="me-2 text-caption"
                />
                <v-btn icon="mdi-unfold-more-horizontal" size="x-small" variant="text" @click="expandAll" />
                <v-btn icon="mdi-unfold-less-horizontal" size="x-small" variant="text" @click="collapseAll" />
              </div>
              <v-list density="compact" open-strategy="multiple" v-model:opened="openedGroups" @update:selected="onScriptSelected">
                <template v-for="cat in filteredCategories" :key="cat.name">
                  <v-list-group :value="cat.name">
                    <template v-slot:activator="{ props }">
                      <v-list-item v-bind="props" :title="cat.name" class="font-weight-bold bg-grey-lighten-5" density="compact" />
                    </template>
                    <v-list-item
                      v-for="script in cat.scripts"
                      :key="script.Name"
                      :title="script.Name"
                      :value="script"
                      color="primary"
                      density="compact"
                    />
                  </v-list-group>
                </template>
              </v-list>
            </div>

            <!-- Resizer 1 -->
            <div class="resizer" @mousedown="startResize(1)" />

            <!-- Middle: Params -->
            <div class="grid-middle pa-2 border-b bg-grey-lighten-5">
              <h3 class="text-subtitle-2 mb-1 font-weight-bold">Parameters</h3>
              <template v-if="selectedScript">
                <v-row density="comfortable">
                  <v-col cols="4" v-for="(arg, index) in selectedScript.Args" :key="index">
                    <v-text-field
                      v-model="argValues[index]"
                      :label="getDesc(arg.Desc)"
                      density="compact"
                      variant="outlined"
                      hide-details
                      :append-inner-icon="hasList(arg.Type) ? 'mdi-magnify' : undefined"
                      @click:append-inner="openParamSelect(arg, index)"
                      :readonly="hasList(arg.Type)"
                      class="text-caption"
                    />
                  </v-col>
                </v-row>
                <div v-if="!selectedScript.Args || selectedScript.Args.length === 0" class="text-caption text-grey mt-1">No parameters required.</div>
              </template>
              <div v-else class="text-caption text-grey mt-1">Select a script from the list above.</div>
            </div>

            <!-- Resizer 2 -->
            <div class="resizer" @mousedown="startResize(2)" />

            <!-- Bottom: Description -->
            <div class="grid-bottom pa-2">
              <h3 class="text-subtitle-2 mb-1 font-weight-bold">Description</h3>
              <div class="text-caption" style="white-space:pre-wrap;line-height:1.2">
                <template v-if="selectedScript">{{ getDesc(selectedScript.Desc) }}</template>
                <template v-else>Select a script to see its description.</template>
              </div>
            </div>
          </div>
        </div>

        <!-- Inject button / Resize handle -->
        <div class="pane-divider d-flex flex-column align-center justify-center bg-grey-darken-4" @mousedown="startHResize">
          <v-btn
            icon="mdi-chevron-double-right"
            size="small"
            color="primary"
            variant="flat"
            class="inject-btn"
            title="スクリプトを挿入 (選択スクリプト+パラメータ)"
            @click.stop="triggerInject"
          />
        </div>

        <!-- Right: Monaco Editor -->
        <div class="pane-right d-flex flex-column" ref="rightRef">
          <vue-monaco-editor
            v-model:value="editingScript"
            theme="vs-dark"
            language="rust"
            :options="editorOptions"
            @mount="handleMount"
            height="100%"
          />
        </div>
      </div>
    </v-card>

    <ParamSelectDialog ref="paramDialog" />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useGlobals } from '../composables/useAppModel';
import ParamSelectDialog from './ParamSelectDialog.vue';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import type { ScriptItemConf, ScriptArgConf } from '../lib/ScriptConfReader';
import { readTextFile } from '@tauri-apps/plugin-fs';

const appModel = useGlobals();

const dialog = ref(false);
const editingScript = ref('');
let resolveCallback: ((s: string | null) => void) | null = null;

const containerRef = ref<HTMLElement | null>(null);
const leftRef = ref<HTMLElement | null>(null);

// ─── Left pane state ────────────────────────────────────────────────
const scriptSearch = ref('');
const openedGroups = ref<string[]>([]);
const selectedScript = ref<ScriptItemConf | null>(null);
const argValues = ref<string[]>(['', '', '', '', '', '']);
const paramDialog = ref<any>(null);

// ─── Horizontal resize ───────────────────────────────────────────────
const leftWidth = ref(40);
const isHResizing = ref(false);

const startHResize = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('button')) return;
  isHResizing.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleHResize = (e: MouseEvent) => {
  if (!isHResizing.value || !containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const newLeft = Math.max(10, Math.min(((e.clientX - rect.left) / rect.width) * 100, 80));
  leftWidth.value = newLeft;
};

const stopHResize = () => {
  isHResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// ─── Vertical resize (left pane) ─────────────────────────────────────
const topHeight = ref(50);
const midHeight = ref(25);
const botHeight = ref(25);
const isVResizing = ref(0);

const startResize = (idx: number) => {
  isVResizing.value = idx;
  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';
};

const stopVResize = () => {
  isVResizing.value = 0;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

const handleVResize = (e: MouseEvent) => {
  if (isVResizing.value === 0 || !leftRef.value) return;
  const rect = leftRef.value.getBoundingClientRect();
  const pct = ((e.clientY - rect.top) / rect.height) * 100;
  const minH = 10;
  if (isVResizing.value === 1) {
    const maxTop = topHeight.value + midHeight.value - minH;
    const newTop = Math.max(minH, Math.min(pct, maxTop));
    midHeight.value -= newTop - topHeight.value;
    topHeight.value = newTop;
  } else if (isVResizing.value === 2) {
    const maxMid = midHeight.value + botHeight.value - minH;
    const newMid = Math.max(minH, Math.min(pct - topHeight.value, maxMid));
    botHeight.value -= newMid - midHeight.value;
    midHeight.value = newMid;
  }
};

// ─── Monaco editor ──────────────────────────────────────────────────
const editorOptions = { automaticLayout: true, minimap: { enabled: false }, wordWrap: 'on' as const, tabSize: 2, insertSpaces: true };
let editorInstance: any = null;
let monacoInstance: any = null;
let autocompleteKeywords: string[] = [];
let providerRegistered = false;

const handleMount = (editor: any, monaco: any) => {
  editorInstance = editor;
  monacoInstance = monaco;
  nextTick(() => editor.layout());
  if (!providerRegistered) {
    providerRegistered = true;
    monaco.languages.registerCompletionItemProvider('rust', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        return { suggestions: autocompleteKeywords.map(kw => ({ label: kw, kind: monaco.languages.CompletionItemKind.Keyword, insertText: kw, range })) };
      },
    });
  }
};

// ─── Script inject ──────────────────────────────────────────────────
const triggerInject = () => {
  if (!selectedScript.value) return;
  const args = (selectedScript.value.Args || []).map((_, i) => argValues.value[i] || '');
  const code = appModel.makeCode(selectedScript.value, args);
  if (editorInstance && monacoInstance) {
    const pos = editorInstance.getPosition();
    if (pos) {
      const model = editorInstance.getModel();
      const lineContent = model.getLineContent(pos.lineNumber);
      const indent = (lineContent.match(/^(\s*)/) || ['', ''])[1];
      const lines = code.split('\n');
      const formatted = lines.map((l, i) => i === 0 ? l : indent + l).join('\n');
      editorInstance.executeEdits('inject', [{ range: new monacoInstance.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column), text: formatted, forceMoveMarkers: true }]);
      editorInstance.focus();
    }
  } else {
    editingScript.value += code;
  }
};

// ─── Script list ────────────────────────────────────────────────────
const filteredCategories = computed(() => {
  if (!scriptSearch.value) return appModel.categories.value.map(c => ({ name: c.Category, scripts: c.Script }));
  return appModel.categories.value
    .map(c => ({ name: c.Category, scripts: c.Script.filter(s => s.SearchString?.includes(scriptSearch.value.toLowerCase())) }))
    .filter(c => c.scripts.length > 0);
});

const getDesc = (d: string | string[]) => Array.isArray(d) ? d.join('\n') : (d || '');
const hasList = (type: string) => type !== 'Value';

const onScriptSelected = (sel: unknown) => {
  const arr = sel as any[];
  if (arr?.length > 0) {
    const s = arr[0] as ScriptItemConf;
    if (s.Name !== selectedScript.value?.Name) {
      selectedScript.value = s;
      argValues.value = ['', '', '', '', '', ''];
      s.Args?.forEach((arg, i) => { if (arg.Default) argValues.value[i] = String(arg.Default); });
    }
  } else {
    selectedScript.value = null;
  }
};

const expandAll = () => { openedGroups.value = appModel.categories.value.map(c => c.Category); };
const collapseAll = () => { openedGroups.value = []; };

watch(scriptSearch, v => { if (v) expandAll(); });

const openParamSelect = (arg: ScriptArgConf, index: number) => {
  if (!hasList(arg.Type)) return;
  let items: { value: string; desc: string }[] = [];
  if (arg.Type === 'List' && arg.ListName) {
    const constData = appModel.getConstList(arg.ListName);
    if (constData?.List) {
      items = constData.List.map(item => Array.isArray(item) ? { desc: item[0], value: item[1] } : { desc: item, value: item });
    }
  } else if (arg.Type === 'Item') {
    items = appModel.getItems().map(i => ({ value: i.aegis_name, desc: appModel.getDisplayName(i) }));
  } else if (arg.Type === 'Skill') {
    items = appModel.getSkills().map(i => ({ value: i.aegis_name, desc: i.name }));
  } else if (arg.Type === 'Mob') {
    items = appModel.getMobs().map(i => ({ value: i.aegis_name, desc: i.name }));
  }
  paramDialog.value?.openDialog({ items, onSelect: (val: string) => { argValues.value[index] = val; } });
};

// ─── Public API ─────────────────────────────────────────────────────
/**
 * ダイアログを開いて編集後のスクリプトを返す Promise
 * キャンセルした場合は null を返す
 */
function open(initialScript: string): Promise<string | null> {
  editingScript.value = initialScript;
  dialog.value = true;
  return new Promise(resolve => { resolveCallback = resolve; });
}

const onConfirm = () => {
  dialog.value = false;
  resolveCallback?.(editingScript.value);
  resolveCallback = null;
};

const onCancel = () => {
  dialog.value = false;
  resolveCallback?.(null);
  resolveCallback = null;
};

defineExpose({ open });

// ─── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  window.addEventListener('mousemove', handleHResize);
  window.addEventListener('mouseup', stopHResize);
  window.addEventListener('mousemove', handleVResize);
  window.addEventListener('mouseup', stopVResize);

  try {
    const basePath = localStorage.getItem('app:basePath') || '';
    let prefix = basePath;
    if (prefix && !prefix.endsWith('/') && !prefix.endsWith('\\')) prefix += '/';
    const raw = await readTextFile(prefix + 'auto_complete.txt');
    autocompleteKeywords = raw.split('\n').map(l => l.trim()).filter(Boolean);
  } catch (e) {
    console.warn('Failed to load auto_complete', e);
  }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleHResize);
  window.removeEventListener('mouseup', stopHResize);
  window.removeEventListener('mousemove', handleVResize);
  window.removeEventListener('mouseup', stopVResize);
});
</script>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: v-bind('leftWidth + "%"') 48px 1fr;
  height: 100%;
  overflow: hidden;
}
.pane-left {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.left-pane-grid {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.grid-top {
  flex: 0 0 v-bind('topHeight + "%"');
  height: v-bind('topHeight + "%"');
  overflow-y: auto;
}
.grid-middle {
  flex: 0 0 v-bind('midHeight + "%"');
  height: v-bind('midHeight + "%"');
  overflow-y: auto;
}
.grid-bottom {
  flex: 0 0 v-bind('botHeight + "%"');
  height: v-bind('botHeight + "%"');
  overflow-y: auto;
}
.resizer {
  height: 4px;
  background: transparent;
  cursor: ns-resize;
  flex: 0 0 auto;
  transition: background 0.2s;
}
.resizer:hover {
  background: var(--v-theme-primary);
  opacity: 0.5;
}
.pane-divider {
  cursor: col-resize;
  z-index: 10;
  user-select: none;
  transition: background-color 0.2s;
}
.pane-divider:hover {
  background-color: #333 !important;
}
.pane-right {
  overflow: hidden;
  min-width: 0;
}
</style>
