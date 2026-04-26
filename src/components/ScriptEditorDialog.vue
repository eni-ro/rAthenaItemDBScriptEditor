<template>
  <v-dialog v-model="dialog" fullscreen :scrim="false" transition="dialog-bottom-transition">
    <div style="display:flex; flex-direction:column; height:100vh; background:#1e1e1e; color:#fff;">

      <!-- ─── Header ─────────────────────────────────────────────── -->
      <div style="display:flex; align-items:center; background:#333; padding:4px 8px; flex-shrink:0; border-bottom:1px solid #555;">
        <span style="font-size:13px; font-weight:600; margin-right:auto;">Script Editor</span>
        <v-btn color="success" variant="flat" size="small" class="mr-2" @click="onConfirm">確定</v-btn>
        <v-btn variant="text" icon="mdi-close" size="small" @click="onCancel" />
      </div>

      <!-- ─── Main area (Left | Divider | Right) ────────────────── -->
      <div
        ref="containerRef"
        style="display:flex; flex:1; overflow:hidden; min-height:0;"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
      >

        <!-- ─── Left Pane ─────────────────────────────────────────── -->
        <div
          ref="leftPaneRef"
          :style="{ width: leftWidth + 'px', minWidth: '160px', display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid #555' }"
        >
          <!-- Script Search -->
          <div style="padding:4px; border-bottom:1px solid #444; flex-shrink:0;">
            <input
              v-model="scriptSearch"
              placeholder="Search scripts..."
              style="width:100%; box-sizing:border-box; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; padding:4px 6px; font-size:11px; outline:none;"
            />
            <div style="display:flex; gap:4px; margin-top:4px;">
              <button @click="expandAll" style="flex:1; background:#3a3a3a; color:#aaa; border:none; border-radius:3px; padding:2px; font-size:10px; cursor:pointer;">全展開</button>
              <button @click="collapseAll" style="flex:1; background:#3a3a3a; color:#aaa; border:none; border-radius:3px; padding:2px; font-size:10px; cursor:pointer;">全折畳</button>
            </div>
          </div>

          <!-- Script List (top) -->
          <div :style="{ flex: topFlex, overflow:'auto', minHeight:'80px' }">
            <v-list density="compact" open-strategy="multiple" v-model:opened="openedGroups" @update:selected="onScriptSelected"
              bg-color="transparent" style="font-size:11px;">
              <template v-for="cat in filteredCategories" :key="cat.name">
                <v-list-group :value="cat.name">
                  <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props" :title="cat.name" density="compact"
                      style="background:#2d2d2d; font-size:11px; font-weight:600;" />
                  </template>
                  <v-list-item
                    v-for="script in cat.scripts" :key="script.Name"
                    :title="script.Name" :value="script" color="primary" density="compact"
                    style="font-size:11px; padding-left:24px;"
                  />
                </v-list-group>
              </template>
            </v-list>
          </div>

          <!-- Vertical Resizer 1 -->
          <div
            style="height:5px; background:#444; cursor:ns-resize; flex-shrink:0;"
            @mousedown.prevent="startVResize(1)"
          />

          <!-- Params (middle) -->
          <div :style="{ flex: midFlex, overflow:'auto', padding:'6px', background:'#252525', minHeight:'60px' }">
            <div style="font-size:11px; font-weight:700; margin-bottom:4px; color:#bbb;">Parameters</div>
            <template v-if="selectedScript">
              <div v-if="!selectedScript.Args || selectedScript.Args.length === 0" style="font-size:11px; color:#888;">No parameters.</div>
              <div v-else style="display:grid; grid-template-columns: repeat(3,1fr); gap:4px;">
                <div v-for="(arg, idx) in selectedScript.Args" :key="idx">
                  <div style="font-size:10px; color:#aaa; margin-bottom:2px;">{{ getDesc(arg.Desc).split('\n')[0] }}</div>
                  <div style="display:flex; align-items:center;">
                    <input
                      v-model="argValues[idx]"
                      :readonly="hasList(arg.Type)"
                      style="flex:1; min-width:0; background:#1e1e1e; color:#fff; border:1px solid #555; border-radius:3px; padding:2px 4px; font-size:11px; outline:none;"
                    />
                    <button v-if="hasList(arg.Type)" @click="openParamSelect(arg, idx)"
                      style="margin-left:3px; background:#444; color:#fff; border:none; border-radius:3px; padding:2px 5px; cursor:pointer; font-size:11px;">…</button>
                  </div>
                </div>
              </div>
            </template>
            <div v-else style="font-size:11px; color:#888;">スクリプトを選択してください</div>
          </div>

          <!-- Vertical Resizer 2 -->
          <div
            style="height:5px; background:#444; cursor:ns-resize; flex-shrink:0;"
            @mousedown.prevent="startVResize(2)"
          />

          <!-- Description (bottom) -->
          <div :style="{ flex: botFlex, overflow:'auto', padding:'6px', background:'#1a1a1a', minHeight:'40px' }">
            <div style="font-size:11px; font-weight:700; margin-bottom:4px; color:#bbb;">Description</div>
            <pre style="font-size:10px; color:#ccc; white-space:pre-wrap; margin:0; font-family:inherit; line-height:1.4;">{{ selectedScript ? getDesc(selectedScript.Desc) : 'Select a script to see its description.' }}</pre>
          </div>
        </div>

        <!-- ─── Horizontal Resizer / Inject button ────────────────── -->
        <div
          style="width:40px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#2d2d2d; border-right:1px solid #555; cursor:col-resize; flex-shrink:0;"
          @mousedown.prevent="startHResize"
        >
          <button
            @click.stop="triggerInject"
            title="スクリプトをMonacoEditorに挿入"
            style="width:30px; height:30px; border-radius:50%; background:#0078d4; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; pointer-events:auto;"
          >›</button>
        </div>

        <!-- ─── Right Pane: Monaco Editor ─────────────────────────── -->
        <div style="flex:1; overflow:hidden; display:flex; flex-direction:column; min-width:0;">
          <vue-monaco-editor
            v-model:value="editingScript"
            theme="vs-dark"
            language="rust"
            :options="editorOptions"
            @mount="handleMount"
            style="flex:1; height:100%;"
          />
        </div>
      </div>
    </div>

    <ParamSelectDialog ref="paramDialog" />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
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
const leftPaneRef = ref<HTMLElement | null>(null);

// ─── Left pane state ────────────────────────────────────────────────
const scriptSearch = ref('');
const openedGroups = ref<string[]>([]);
const selectedScript = ref<ScriptItemConf | null>(null);
const argValues = ref<string[]>(['', '', '', '', '', '']);
const paramDialog = ref<any>(null);

// ─── Layout sizes ────────────────────────────────────────────────────
const leftWidth = ref(360);     // px
const topFlex = ref(5);         // flex values (relative)
const midFlex = ref(3);
const botFlex = ref(2);

// ─── Horizontal resize ───────────────────────────────────────────────
let isHResizing = false;
const startHResize = () => { isHResizing = true; };

// ─── Vertical resize ─────────────────────────────────────────────────
let vResizeIdx = 0;
let vResizeStartY = 0;
let vResizeStartTop = 0;
let vResizeStartMid = 0;
let vResizeStartBot = 0;

const startVResize = (idx: number) => {
  vResizeIdx = idx;
  vResizeStartY = 0;
  vResizeStartTop = topFlex.value;
  vResizeStartMid = midFlex.value;
  vResizeStartBot = botFlex.value;
};

const onMouseMove = (e: MouseEvent) => {
  if (isHResizing && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const newW = Math.max(160, Math.min(e.clientX - rect.left, rect.width - 200));
    leftWidth.value = newW;
    return;
  }
  if (vResizeIdx > 0 && leftPaneRef.value) {
    if (vResizeStartY === 0) { vResizeStartY = e.clientY; return; }
    const rect = leftPaneRef.value.getBoundingClientRect();
    const pct = (e.clientY - rect.top) / rect.height;
    const total = vResizeStartTop + vResizeStartMid + vResizeStartBot;
    if (vResizeIdx === 1) {
      const newTop = Math.max(1, Math.min(pct * total, total - 2));
      const diff = newTop - vResizeStartTop;
      topFlex.value = Math.max(1, vResizeStartTop + diff);
      midFlex.value = Math.max(1, vResizeStartMid - diff);
    } else if (vResizeIdx === 2) {
      const aboveMid = (e.clientY - rect.top - (topFlex.value / (topFlex.value + midFlex.value + botFlex.value)) * rect.height);
      const pct2 = aboveMid / rect.height;
      const newMid = Math.max(1, Math.min(pct2 * total + vResizeStartTop, total - 1 - topFlex.value));
      const diff2 = newMid - vResizeStartMid;
      midFlex.value = Math.max(1, vResizeStartMid + diff2);
      botFlex.value = Math.max(1, vResizeStartBot - diff2);
    }
  }
};

const onMouseUp = () => {
  isHResizing = false;
  vResizeIdx = 0;
  vResizeStartY = 0;
};

// ─── Monaco editor ──────────────────────────────────────────────────
const editorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  tabSize: 2,
  insertSpaces: true,
  fontSize: 13,
};
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
      const formatted = lines.map((l: string, i: number) => i === 0 ? l : indent + l).join('\n');
      editorInstance.executeEdits('inject', [{
        range: new monacoInstance.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
        text: formatted,
        forceMoveMarkers: true,
      }]);
      editorInstance.focus();
    }
  } else {
    editingScript.value += code;
  }
};

// ─── Script list ────────────────────────────────────────────────────
const filteredCategories = computed(() => {
  if (!scriptSearch.value) return appModel.categories.value.map(c => ({ name: c.Category, scripts: c.Script }));
  const q = scriptSearch.value.toLowerCase();
  return appModel.categories.value
    .map(c => ({ name: c.Category, scripts: c.Script.filter(s => s.SearchString?.includes(q)) }))
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
</script>
