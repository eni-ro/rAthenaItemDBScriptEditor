<template>
  <v-dialog v-model="dialog" fullscreen :scrim="false" transition="dialog-bottom-transition">
    <div style="display:flex; flex-direction:column; height:100vh; background:#1e1e1e; color:#fff;">

      <!-- ─── Header ─────────────────────────────────────────────── -->
      <div class="editor-header">
        <span class="editor-title">Script Editor</span>
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
          <div class="editor-search-box">
            <input
              v-model="scriptSearch"
              placeholder="Search scripts..."
              class="editor-search-input"
            />
            <div class="editor-tree-controls">
              <button @click="expandAll">Expand All</button>
              <button @click="collapseAll">Collapse All</button>
            </div>
          </div>

          <!-- Script List (top) -->
          <div class="editor-list-container" :style="{ flex: topFlex }">
            <v-list density="compact" open-strategy="multiple" v-model:opened="openedGroups" @update:selected="onScriptSelected"
              bg-color="transparent" class="editor-list">
              <template v-for="cat in filteredCategories" :key="cat.name">
                <v-list-group :value="cat.name">
                  <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props" :title="cat.name" density="compact" class="editor-list-group-header" />
                  </template>
                  <v-list-item
                    v-for="script in cat.scripts" :key="script.Name"
                    :title="script.Name" :value="script" color="primary" density="compact"
                    class="editor-list-item"
                  />
                </v-list-group>
              </template>
            </v-list>
          </div>

          <!-- Vertical Resizer 1 -->
          <div class="editor-v-splitter" @mousedown.prevent="startVResize(1)">
            <div class="v-splitter-line"></div>
          </div>

          <!-- Params (middle) -->
          <div class="editor-params-container" :style="{ flex: midFlex }">
            <div class="editor-section-title">Parameters</div>
            <template v-if="selectedScript">
              <div v-if="!selectedScript.Args || selectedScript.Args.length === 0" class="editor-empty-text">No parameters.</div>
              <div v-else class="editor-params-grid">
                <div v-for="(arg, idx) in selectedScript.Args" :key="idx">
                  <div class="editor-arg-desc">{{ getDesc(arg.Desc).split('\n')[0] }}</div>
                  <div class="editor-arg-input-wrapper">
                    <input
                      v-model="argValues[idx]"
                      :readonly="hasList(arg.Type)"
                      class="editor-arg-input"
                    />
                    <button v-if="hasList(arg.Type)" @click="openParamSelect(arg, idx)" class="editor-arg-btn">…</button>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="editor-empty-text">Please select a script</div>
          </div>

          <!-- Vertical Resizer 2 -->
          <div class="editor-v-splitter" @mousedown.prevent="startVResize(2)">
            <div class="v-splitter-line"></div>
          </div>

          <!-- Description (bottom) -->
          <div class="editor-desc-container" :style="{ flex: botFlex }">
            <div class="editor-section-title">Description</div>
            <pre class="editor-desc-text">{{ selectedScript ? getDesc(selectedScript.Desc) : 'Select a script to see its description.' }}</pre>
          </div>
        </div>

        <!-- ─── Horizontal Resizer / Inject button ────────────────── -->
        <div class="editor-h-splitter" @mousedown.prevent="startHResize">
          <div class="inject-btn-area" @mousedown.stop>
            <v-btn
              icon="mdi-chevron-right"
              variant="flat"
              class="inject-btn"
              title="Insert script into editor"
              @click.stop="triggerInject"
            />
          </div>
        </div>

        <!-- ─── Right Pane: Monaco Editor ─────────────────────────── -->
        <div style="flex:1; overflow:hidden; display:flex; flex-direction:column; min-width:0;">
          <vue-monaco-editor
            v-model:value="editingScript"
            theme="vs-dark"
            language="rscript"
            :options="editorOptions"
            @mount="handleMount"
            style="flex:1; height:100%;"
          />
        </div>
      </div>

      <!-- ─── Footer ─────────────────────────────────────────────── -->
      <div class="editor-footer">
        <v-btn color="grey-darken-3" variant="flat" size="small" class="mr-2" @click="onCancel">Cancel</v-btn>
        <v-btn color="success" variant="flat" size="small" @click="onConfirm">Confirm (Ctrl+Enter)</v-btn>
      </div>
    </div>

    <div
      v-if="tipVisible"
      class="selection-tip"
      :style="{ left: tipX + 'px', top: tipY + 'px' }"
    >
      <div class="tip-content">{{ tipContent }}</div>
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

// ─── Selection Tip state ─────────────────────────────────────────────
const tipVisible = ref(false);
const tipContent = ref('');
const tipX = ref(0);
const tipY = ref(0);

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
  fontSize: 15,
  // Remove RO script special characters from separators to ensure correct word selection
  wordSeparators: "`~!%^&*()-=+[{]}\\|;:\",<>/?",
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
    const langId = 'rscript';

    // Register a custom language for rAthena Script
    monaco.languages.register({ id: langId });

    // Set word definition to include special characters like @, $, ., #, '
    // and basic syntax configuration
    monaco.languages.setLanguageConfiguration(langId, {
      wordPattern: /[a-zA-Z_0-9.@$#'#]+/g,
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    });

    // Simple syntax highlighting (Monarch tokens)
    monaco.languages.setMonarchTokensProvider(langId, {
      tokenizer: {
        root: [
          // Variables - These MUST come first to take precedence over delimiters like '.'
          [/(?:\.@|\$@|##|[@$.#'])[a-zA-Z0-9_]+\$?/, 'variable'],
          [/[a-zA-Z_][a-zA-Z0-9_]*\$/, 'variable'],

          [/[{}]/, 'delimiter.bracket'],
          [/[()]/, 'delimiter.parenthesis'],
          [/[\[\]]/, 'delimiter.square'],
          [/[;,.]/, 'delimiter'],
          // Control Flow Keywords
          [/\b(if|else|switch|case|default|for|while|do|break|continue|return|function|script)\b/, 'keyword'],
          // Common constants
          [/\b(true|false|null)\b/, 'keyword'],
          // Numbers
          [/\b\d+\b/, 'number'],
          // Strings
          [/"([^"\\]|\\.)*"/, 'string'],
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          // Whitespace
          { include: '@whitespace' },
          // Operators
          [/[<>!%&|+\-*/=]/, 'operator'],
        ],
        whitespace: [
          [/[ \t\r\n]+/, 'white'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
      },
    });

    monaco.languages.registerCompletionItemProvider(langId, {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = { 
          startLineNumber: position.lineNumber, 
          endLineNumber: position.lineNumber, 
          startColumn: word.startColumn, 
          endColumn: word.endColumn 
        };

        // Scan the current document for variables to provide autocomplete
        const text = model.getValue();
        // Extract prefixed variables and string variables
        const varRegex = /(?:\.@|\$@|##|[@$.#'])[a-zA-Z0-9_]+\$?|[a-zA-Z_][a-zA-Z0-9_]*\$/g;
        const matches = text.match(varRegex) || [];
        const uniqueVars = Array.from(new Set(matches));

        const suggestions = [
          // Commands from auto_complete.txt (e.g. mes, getitem)
          ...autocompleteKeywords.map(kw => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: kw,
            range
          })),
          // Dynamic variables found in the current script
          ...uniqueVars.map(v => ({
            label: v,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: v,
            range
          }))
        ];

        return { suggestions };
      },
    });
  }

  editor.onDidChangeCursorSelection((e: any) => {
    const selection = e.selection;
    if (selection.isEmpty()) {
      tipVisible.value = false;
      return;
    }

    const model = editor.getModel();
    if (!model) return;
    const text = model.getValueInRange(selection).trim();
    if (!text || text.length > 100) {
      tipVisible.value = false;
      return;
    }

    // Search
    let match: string | null = null;
    const item = appModel.getItems().find(i => i.aegis_name === text);
    if (item) {
      match = `[Item] ${appModel.getDisplayName(item)}`;
    } else {
      const skill = appModel.getSkills().find(s => s.aegis_name === text);
      if (skill) {
        match = `[Skill] ${appModel.getSkillDisplayName(skill)}`;
      } else {
        const mob = appModel.getMobs().find(m => m.aegis_name === text);
        if (mob) {
          match = `[Mob] ${mob.name}`;
        }
      }
    }

    if (match) {
      tipContent.value = match;
      tipVisible.value = true;
      
      // Calculate position
      const pos = selection.getEndPosition();
      // Use internal but widely available method to get pixel position
      const pixelPos = editor.getScrolledVisiblePosition(pos);
      if (pixelPos) {
        const editorRect = editor.getDomNode().getBoundingClientRect();
        tipX.value = editorRect.left + pixelPos.left;
        tipY.value = editorRect.top + pixelPos.top + pixelPos.height + 5;
      }
    } else {
      tipVisible.value = false;
    }
  });

  editor.onDidScrollChange(() => {
    tipVisible.value = false;
  });
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
    items = appModel.getSkills().map(i => ({ value: i.aegis_name, desc: appModel.getSkillDisplayName(i) }));
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
  const cb = resolveCallback;
  resolveCallback = null;
  dialog.value = false;
  
  // Remove leading and trailing empty lines (including those with only whitespace)
  const trimmed = editingScript.value
    .replace(/^(\s*[\r\n])+/g, '')
    .replace(/([\r\n]\s*)+$/g, '');
    
  cb?.(trimmed);
};

const onCancel = () => {
  const cb = resolveCallback;
  resolveCallback = null;
  dialog.value = false;
  cb?.(null);
};

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (!dialog.value) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    onConfirm();
    e.preventDefault();
    e.stopPropagation();
  }
};

watch(dialog, (val) => {
  if (val) {
    window.addEventListener('keydown', handleGlobalKeyDown, true);
  } else {
    window.removeEventListener('keydown', handleGlobalKeyDown, true);
    // If closed by other means (like Esc), ensure callback is resolved
    if (resolveCallback) {
      onCancel();
    }
  }
});

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

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  background: #333;
  padding: 8px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid #555;
}
.editor-title {
  font-size: 14pt;
  font-weight: 600;
  margin-right: auto;
}
.editor-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: #333;
  padding: 10px 16px;
  flex-shrink: 0;
  border-top: 1px solid #555;
}

.editor-search-box {
  padding: 8px;
  border-bottom: 1px solid #444;
  flex-shrink: 0;
}
.editor-search-input {
  width: 100%;
  box-sizing: border-box;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11pt;
  outline: none;
}
.editor-tree-controls {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.editor-tree-controls button {
  flex: 1;
  background: #3a3a3a;
  color: #aaa;
  border: none;
  border-radius: 3px;
  padding: 4px;
  font-size: 10pt;
  cursor: pointer;
}
.editor-tree-controls button:hover {
  background: #4a4a4a;
  color: #fff;
}

.editor-list-container {
  overflow: auto;
  min-height: 80px;
}
.editor-list {
  /* Inherits from global */
}
.editor-list-group-header {
  background: #2d2d2d;
  font-weight: 600;
}
.editor-list-item {
  padding-left: 24px;
}

.editor-params-container {
  overflow: auto;
  padding: 10px;
  background: #252525;
  min-height: 60px;
}
.editor-section-title {
  font-size: 11pt;
  font-weight: 700;
  margin-bottom: 8px;
  color: #bbb;
}
.editor-empty-text {
  font-size: 11pt;
  color: #888;
}
.editor-params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.editor-arg-desc {
  font-size: 10pt;
  color: #aaa;
  margin-bottom: 4px;
}
.editor-arg-input-wrapper {
  display: flex;
  align-items: center;
}
.editor-arg-input {
  flex: 1;
  min-width: 0;
  background: #1e1e1e;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 11pt;
  outline: none;
}
.editor-arg-btn {
  margin-left: 6px;
  background: #444;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11pt;
}

.editor-desc-container {
  overflow: auto;
  padding: 10px;
  background: #1a1a1a;
  min-height: 40px;
}
.editor-desc-text {
  font-size: 11pt;
  color: #ccc;
  white-space: pre-wrap;
  margin: 0;
  font-family: inherit;
  line-height: 1.5;
}

.selection-tip {
  position: fixed;
  z-index: 10000;
  background: rgba(30, 30, 30, 0.9);
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 10.5pt;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
  backdrop-filter: blur(8px);
  white-space: nowrap;
  animation: tip-fade-in 0.2s ease-out;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.tip-content {
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

@keyframes tip-fade-in {
  from { opacity: 0; transform: translateY(0px); }
  to { opacity: 1; transform: translateY(5px); }
}

/* Splitter styles */
.editor-h-splitter {
  width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #2d2d2d;
  border-right: 1px solid #444;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: background 0.2s;
}
.editor-h-splitter:hover {
  background: #333;
}

.inject-btn-area {
  z-index: 10;
  cursor: default;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.inject-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%) !important;
  color: white !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: all 0.2s ease !important;
}
.inject-btn:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
}
.inject-btn:active {
  transform: scale(0.92);
}

.editor-v-splitter {
  height: 8px;
  background: #2d2d2d;
  cursor: ns-resize;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.2s;
  border-top: 1px solid #444;
  border-bottom: 1px solid #444;
}
.editor-v-splitter:hover {
  background: #383838;
}
.v-splitter-line {
  width: 30px;
  height: 1px;
  background: #555;
}
</style>
