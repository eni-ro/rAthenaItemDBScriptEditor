<template>
  <v-app>
    <!-- Menu Bar -->
    <v-app-bar color="grey-darken-4" density="compact" elevation="2">
      <v-app-bar-title>
        <span class="text-subtitle-1 font-weight-bold">rAthena Item DB Script Editor</span>
      </v-app-bar-title>

      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="mr-1">Settings</v-btn>
        </template>
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-database-cog" title="DB Paths" @click="openSettings" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid class="fill-height pa-0">
        <!-- Loading / Error -->
        <v-row class="fill-height ma-0" justify="center" align="center" v-if="!isLoaded">
          <div v-if="loadError" class="text-center px-4">
            <v-icon color="error" size="48">mdi-alert-circle</v-icon>
            <h2 class="text-h6 text-error mt-4">Failed to load initial data</h2>
            <div class="text-body-1 mt-2 text-pre-wrap">{{ loadError }}</div>
            <div class="text-caption mt-4">
              Please ensure that "db.yml" and other files are located in the same folder as the executable.<br/>
              In the development environment, they need to be placed in "src-tauri/target/debug/".
            </div>
            <v-btn color="primary" @click="retryLoad" class="mt-4">Retry</v-btn>
          </div>
          <v-progress-circular v-else indeterminate color="primary" />
        </v-row>

        <!-- Main Layout -->
        <div v-else class="main-layout" ref="containerRef">

          <!-- Left: Search Panel -->
          <div class="pane-search border-e">
            <SearchPanel />
          </div>

          <!-- Horizontal Resizer -->
          <div
            class="pane-divider d-flex align-center justify-center bg-grey-darken-4 border-e"
            @mousedown="startResize"
          >
            <div class="resizer-handle" />
          </div>

          <!-- Right: Tabs (Items / Combos) -->
          <div class="pane-content d-flex flex-column">
            <v-tabs v-model="mainTab" bg-color="grey-darken-3" density="compact" class="flex-shrink-0">
              <v-tab value="items">
                <v-icon size="small" class="mr-1">mdi-sword</v-icon>
                Items
              </v-tab>
              <v-tab value="combos">
                <v-icon size="small" class="mr-1">mdi-link-variant</v-icon>
                Combos
              </v-tab>
            </v-tabs>

            <div class="flex-grow-1 position-relative overflow-hidden" style="position: relative;">
              <ItemEditPanel v-show="mainTab === 'items'" />
              <ComboEditPanel v-show="mainTab === 'combos'" />
            </div>
          </div>
        </div>
      </v-container>
    </v-main>

    <SettingsView ref="settingsView" />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import * as jsYaml from 'js-yaml';
import { useGlobals } from './composables/useAppModel';
import { settings, type WindowState } from './lib/SettingsStore';
import SearchPanel from './components/SearchPanel.vue';
import ItemEditPanel from './components/ItemEditPanel.vue';
import ComboEditPanel from './components/ComboEditPanel.vue';
import SettingsView from './components/SettingsView.vue';


const appModel = useGlobals();
const isLoaded = appModel.isLoaded;
const mainTab = appModel.mainTab;  // ref to use in template
const containerRef = ref<HTMLElement | null>(null);
const appWindow = getCurrentWindow();
const settingsView = ref<any>(null);

// ─── Horizontal Resizing ─────────────────────────────────────────────
const leftWidth = ref(25);
const isResizing = ref(false);

const startResize = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('button')) return;
  isResizing.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value || !containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const newLeft = Math.max(15, Math.min(((e.clientX - rect.left) / rect.width) * 100, 60));
  leftWidth.value = newLeft;
};

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  settings.leftWidth = leftWidth.value;
  settings.save();
};

// ─── Window State ────────────────────────────────────────────────────
let saveTimeout: number | null = null;
const debouncedSaveWindowState = async () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(async () => {
    const isMaximized = await appWindow.isMaximized();
    const size = await appWindow.innerSize();
    const state: WindowState = {
      isMaximized,
      width: isMaximized && settings.data.windowState ? settings.data.windowState.width : size.width,
      height: isMaximized && settings.data.windowState ? settings.data.windowState.height : size.height,
    };
    settings.data.windowState = state;
    await settings.save();
  }, 500);
};

// ─── Settings ────────────────────────────────────────────────────────
function openSettings() {
  const invoke = async () => {
    try {
      const dbPath = appModel.dbYmlPath.value;
      const raw: string = await tauriInvoke('read_file_raw', { path: dbPath });
      const conf = (jsYaml.load(raw) as any) || {};
      settingsView.value?.open({
        Encoding: conf.Encoding || 'utf-8',
        Item: conf.Item || [],
        ItemCombos: conf.ItemCombos || [],
        ItemName: conf.ItemName || [],
        Mob: conf.Mob || [],
        Skill: conf.Skill || [],
      }, dbPath);
    } catch (e) {
      settingsView.value?.open({ Encoding: 'utf-8', Item: [], ItemCombos: [], ItemName: [], Mob: [], Skill: [] }, appModel.dbYmlPath.value);
    }
  };
  invoke();
}

// ─── Load ────────────────────────────────────────────────────────────
const loadError = ref('');

const doLoad = async () => {
  loadError.value = '';
  appModel.isLoaded.value = false;
  try {
    const data = await settings.load();
    leftWidth.value = data.leftWidth || 25;

    if (data.windowState) {
      if (data.windowState.isMaximized) {
        await appWindow.maximize();
      } else {
        await appWindow.setSize(new LogicalSize(data.windowState.width, data.windowState.height));
      }
    }

    const prefix = await settings.getBasePath();
    await appModel.loadData(
      prefix + 'script.yml',
      prefix + 'const.yml',
      prefix + 'db.yml'
    );
    localStorage.setItem('app:basePath', prefix);
  } catch (e: any) {
    loadError.value = String(e?.message || e || 'Unknown Error');
  }
};

const retryLoad = () => doLoad();

let unlistenResize: any;
let unlistenMoved: any;

onMounted(async () => {
  await doLoad();
  window.addEventListener('mousemove', handleResize);
  window.addEventListener('mouseup', stopResize);
  unlistenResize = await appWindow.onResized(() => debouncedSaveWindowState());
  unlistenMoved = await appWindow.onMoved(() => debouncedSaveWindowState());
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleResize);
  window.removeEventListener('mouseup', stopResize);
  if (unlistenResize) unlistenResize();
  if (unlistenMoved) unlistenMoved();
});
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  overflow: hidden;
  /* Use a consistent base font size */
  font-size: 13px;
  line-height: 1.5;
}

/* Vuetify typography overrides for global consistency */
.v-application {
  font-size: 13px !important;
}

.text-body-1 {
  font-size: 12pt !important;
  line-height: 1.6 !important;
}

.text-body-2 {
  font-size: 11pt !important;
  line-height: 1.5 !important;
}

.text-caption {
  font-size: 10.5pt !important;
}

.text-subtitle-1 {
  font-size: 12pt !important;
  font-weight: 600 !important;
}

.text-subtitle-2 {
  font-size: 11pt !important;
  font-weight: 600 !important;
}

/* Standardize list and button sizes */
.v-list-item-title {
  font-size: 11.5pt !important;
}
.v-list-item-subtitle {
  font-size: 10pt !important;
}
.v-tab, .v-btn {
  font-size: 11pt !important;
  text-transform: none !important;
}
.v-label, .v-field__input {
  font-size: 11pt !important;
}

.main-layout {
  display: grid;
  grid-template-columns: v-bind('leftWidth + "%"') auto 1fr;
  width: 100%;
  flex-grow: 1;
  min-height: 0;
  overflow: hidden;
}

.pane-search {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pane-content {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pane-divider {
  position: relative;
  cursor: col-resize;
  z-index: 10;
  user-select: none;
  transition: background-color 0.2s;
  width: 6px;
}

.pane-divider:hover {
  background-color: var(--v-theme-primary) !important;
  opacity: 0.7;
}

.resizer-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.v-main {
  /* Vuetify handles layout padding */
}

.v-container.fill-height {
  height: 100% !important;
  display: flex;
  flex-direction: column;
}

/* Custom Scrollbar Styles */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: content-box;
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>