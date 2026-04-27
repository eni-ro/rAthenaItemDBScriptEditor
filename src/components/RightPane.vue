<template>
  <div class="right-pane-wrapper" ref="paneWrapper">
    <!-- Top Bar -->
    <v-toolbar color="grey-darken-3" density="compact">
      <div class="px-2 font-weight-bold text-subtitle-1">
        Item: {{ appModel.currentItem.value?.aegis_name || "None" }}
        <span v-if="appModel.currentItem.value"
          >- {{ appModel.currentItem.value.name }}</span
        >
      </div>
      <v-spacer></v-spacer>
      <v-btn color="primary" variant="flat" class="mr-2" @click="openItemSelect"
        >Load</v-btn
      >
      <v-btn
        color="success"
        variant="flat"
        :disabled="!appModel.currentItem.value"
        @click="saveItem"
        >Save</v-btn
      >
    </v-toolbar>

    <!-- Tabs -->
    <v-tabs v-model="tab" bg-color="grey-darken-4">
      <v-tab value="script">Script</v-tab>
      <v-tab value="equip">EquipScript</v-tab>
      <v-tab value="unequip">UnEquipScript</v-tab>
    </v-tabs>

    <!-- Editors -->
    <v-window
      v-model="tab"
      class="flex-grow-1 bg-black"
      style="height: 0"
      :transition="false"
      :reverse-transition="false"
    >
      <v-window-item value="script" class="fill-height">
        <vue-monaco-editor
          v-model:value="scriptCode"
          theme="vs-dark"
          language="rust"
          :options="editorOptions"
          @mount="(editor, monaco) => handleMount(editor, monaco, 'script')"
          height="100%"
        />
      </v-window-item>
      <v-window-item value="equip" class="fill-height">
        <vue-monaco-editor
          v-model:value="equipCode"
          theme="vs-dark"
          language="rust"
          :options="editorOptions"
          @mount="(editor, monaco) => handleMount(editor, monaco, 'equip')"
          height="100%"
        />
      </v-window-item>
      <v-window-item value="unequip" class="fill-height">
        <vue-monaco-editor
          v-model:value="unequipCode"
          theme="vs-dark"
          language="rust"
          :options="editorOptions"
          @mount="(editor, monaco) => handleMount(editor, monaco, 'unequip')"
          height="100%"
        />
      </v-window-item>
    </v-window>

    <ItemSelectDialog ref="itemSelectDialog" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef, nextTick } from "vue";
import { useGlobals } from "../composables/useAppModel";
import ItemSelectDialog from "./ItemSelectDialog.vue";
import { saveItemToYaml } from "../lib/DbProcessor";
import { readTextFile } from "@tauri-apps/plugin-fs";

import { VueMonacoEditor } from "@guolao/vue-monaco-editor";

const appModel = useGlobals();
const tab = ref("script");

const scriptCode = ref("");
const equipCode = ref("");
const unequipCode = ref("");

const itemSelectDialog = ref<InstanceType<typeof ItemSelectDialog> | null>(
  null,
);
const paneWrapper = ref<HTMLElement | null>(null);

const snackbar = ref({ show: false, text: "", color: "success" });
const editorInstances = shallowRef<Record<string, any>>({});

const editorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  wordWrap: "on",
  tabSize: 2,
  insertSpaces: true,
};

let autocompleteKeywords: string[] = [];

// Watch currentItem changes
watch(
  () => appModel.currentItem.value,
  (newVal) => {
    if (newVal) {
      scriptCode.value = newVal.script || "";
      equipCode.value = newVal.equipScript || "";
      unequipCode.value = newVal.unEquipScript || "";

      // Force layout update after data change
      nextTick(() => {
        Object.values(editorInstances.value).forEach((editor) => {
          editor.layout();
        });
      });
    } else {
      scriptCode.value = "";
      equipCode.value = "";
      unequipCode.value = "";
    }
  },
  { deep: true },
);

// Watch tab changes to ensure visibility/layout is correct
watch(tab, () => {
  nextTick(() => {
    const editor = editorInstances.value[tab.value];
    if (editor) {
      editor.layout();
    }
  });
});

onMounted(async () => {
  try {
    const basePath = localStorage.getItem("app:basePath") || "";
    let prefix = basePath;
    if (prefix && !prefix.endsWith("/") && !prefix.endsWith("\\")) {
      prefix += "/";
    }
    const raw = await readTextFile(prefix + "auto_complete.txt");
    autocompleteKeywords = raw
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);
  } catch (e) {
    console.warn("Failed to load auto_complete", e);
  }

  // Setup ResizeObserver for robust editor layout
  if (paneWrapper.value) {
    const ro = new ResizeObserver(() => {
      Object.values(editorInstances.value).forEach((editor) => {
        editor.layout();
      });
    });
    ro.observe(paneWrapper.value);

    onUnmounted(() => {
      ro.disconnect();
    });
  }
});

let providerRegistered = false;

let monacoInstance: any = null;

const handleMount = (editor: any, monaco: any, name: string) => {
  editorInstances.value[name] = editor;
  nextTick(() => editor.layout());
  if (!monacoInstance) monacoInstance = monaco;

  if (!providerRegistered) {
    providerRegistered = true;
    monaco.languages.registerCompletionItemProvider("rust", {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = autocompleteKeywords.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
        }));

        return { suggestions };
      },
    });
  }
};

const openItemSelect = () => {
  if (itemSelectDialog.value) {
    const count = appModel.getItems().length;
    snackbar.value = {
      show: true,
      text: `Opening dialog, items count: ${count}`,
      color: "info",
    };
    itemSelectDialog.value.openDialog((aegis_name: string) => {
      appModel.loadItem(aegis_name);
    });
  }
};

const saveItem = async () => {
  const current = appModel.currentItem.value;
  if (!current) return;

  try {
    const toSave = {
      ...current,
      script: scriptCode.value,
      equipScript: equipCode.value,
      unEquipScript: unequipCode.value,
    };

    const result = await saveItemToYaml(toSave, appModel.getEncoding());

    if (result.success) {
      // Update our internal memory model
      const dbItem = appModel
        .getItems()
        .find((i) => i.aegis_name === current.aegis_name);
      if (dbItem) {
        Object.assign(dbItem, toSave);
      }

      snackbar.value = {
        show: true,
        text: "Saved successfully",
        color: "success",
      };
    } else {
      snackbar.value = {
        show: true,
        text: `Save Failed: ${result.error}`,
        color: "error",
      };
    }
  } catch (e: any) {
    console.error(e);
    snackbar.value = {
      show: true,
      text: `Save Error: ${e.message}`,
      color: "error",
    };
  }
};

// Expose a method for App to inject code
const injectCode = (code: string) => {
  // Determine which editor is active based on tab
  const editor = editorInstances.value[tab.value];
  if (editor) {
    const position = editor.getPosition();
    if (position) {
      // get indent space from start of line
      const model = editor.getModel();
      const lineContent = model.getLineContent(position.lineNumber);
      const match = lineContent.match(/^(\s*)/);
      const indentCount = match ? match[1].length : 0;
      const indentStr = " ".repeat(indentCount);

      // Handle indentation insertion logic
      let formattedCode = code;
      const lines = code.split("\n");
      if (lines.length > 1) {
        formattedCode = lines
          .map((l, i) => (i === 0 ? l : indentStr + l))
          .join("\n");
      }

      if (monacoInstance) {
        editor.executeEdits("my-source", [
          {
            range: new monacoInstance.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column,
            ),
            text: formattedCode,
            forceMoveMarkers: true,
          },
        ]);
      } else {
        // Fallback
        const model = editor.getModel();
        model.applyEdits([
          {
            range: model.getFullModelRange(),
            text: model.getValue() + "\n" + formattedCode,
          },
        ]);
      }

      editor.focus();
    }
  } else {
    // If no editor loaded/focused just append text to the ref
    if (tab.value === "script") {
      scriptCode.value += code;
    } else if (tab.value === "equip") {
      equipCode.value += code;
    } else {
      unequipCode.value += code;
    }
  }
};

defineExpose({
  injectCode,
});
// Need window.monaco available for injection Ranges
</script>

<style scoped>
.right-pane-wrapper {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}
.v-window-item {
  height: 100%;
}
/* Force Vuetify window containers to fill height for Monaco */
:deep(.v-window),
:deep(.v-window__container) {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}
</style>
