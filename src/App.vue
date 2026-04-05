<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0">
        <v-row class="fill-height ma-0" justify="center" align="center" v-if="!isLoaded">
          <div v-if="loadError" class="text-center px-4">
            <v-icon color="error" size="48">mdi-alert-circle</v-icon>
            <h2 class="text-h6 text-error mt-4">初期データの読み込みに失敗しました</h2>
            <div class="text-body-1 mt-2 text-pre-wrap">{{ loadError }}</div>
            <div class="text-caption mt-4">
              実行ファイルと同じフォルダに「db.ml」などが配置されているか確認してください。<br/>
              また、開発環境(tauri dev)の場合は「src-tauri/target/debug/」に配置されている必要があります。
            </div>
            <v-btn color="primary" @click="retryLoad" class="mt-4">再試行</v-btn>
          </div>
          <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
        </v-row>
        
        <div class="layout-grid fill-height" v-else-if="isLoaded" ref="containerRef">
          <!-- Left Pane -->
          <div class="pane-left border-e position-relative">
            <LeftPane 
              @inject="onInject"
            />
          </div>
          
          <!-- Middle Separator / Inject button / Resizer -->
          <div 
            class="pane-divider d-flex align-center justify-center pa-2 border-e bg-grey-darken-4"
            @mousedown="startResize"
          >
            <InjectButton @click="triggerInject" />
            <div class="resizer-handle"></div>
          </div>

          <!-- Right Pane -->
          <div class="pane-right d-flex flex-column position-relative" style="min-width: 0;">
            <RightPane ref="rightPane" />
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import LeftPane from './components/LeftPane.vue';
import RightPane from './components/RightPane.vue';
import InjectButton from './components/InjectButton.vue';
import { useGlobals } from './composables/useAppModel';
import { settings, type WindowState } from './lib/SettingsStore';

const appModel = useGlobals();
const isLoaded = appModel.isLoaded;
const rightPane = ref<any>(null);
const containerRef = ref<HTMLElement | null>(null);
const appWindow = getCurrentWindow();

// Horizontal Resizing State
const leftWidth = ref(40);
const isResizing = ref(false);

const startResize = (e: MouseEvent) => {
  // Only start if clicking the divider itself, not the button
  if ((e.target as HTMLElement).closest('button')) return;
  
  isResizing.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const pointerX = e.clientX - rect.left;
  const totalW = rect.width;
  let newLeftPercent = (pointerX / totalW) * 100;

  // Enforce 10% - 80%
  newLeftPercent = Math.max(10, Math.min(newLeftPercent, 80));
  leftWidth.value = newLeftPercent;
};

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // Save to SettingsStore
  settings.leftWidth = leftWidth.value;
  settings.save();
};

// Window State Debounced Saving
let saveTimeout: number | null = null;
const debouncedSaveWindowState = async () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(async () => {
    const isMaximized = await appWindow.isMaximized();
    const size = await appWindow.innerSize();
    // We only save size if not maximized to avoid saving maximized dimensions as "normal" size
    const state: WindowState = {
      isMaximized,
      width: isMaximized && settings.data.windowState ? settings.data.windowState.width : size.width,
      height: isMaximized && settings.data.windowState ? settings.data.windowState.height : size.height
    };
    settings.data.windowState = state;
    await settings.save();
  }, 500);
};

// We need to keep track of the selected script/args from LeftPane
// Instead of propagating events all the way, LeftPane can expose 
// current script and args, or they can be in a separate composable/state.
// For simplicity, LeftPane can emit the inject event with the prepared string.

const onInject = (code: string) => {
  if (rightPane.value) {
    rightPane.value.injectCode(code);
  }
};

// Trigger inject from the middle button
const triggerInject = () => {
  // We can use an EventBus or a shared state to tell LeftPane to generate code
  // Let's create a global inject trigger
  document.dispatchEvent(new CustomEvent('app:trigger-inject'));
};

const loadError = ref<string>('');

const doLoad = async () => {
  loadError.value = '';
  appModel.isLoaded.value = false;

  try {
    // 1. Load Settings
    const data = await settings.load();
    leftWidth.value = data.leftWidth;

    // 2. Apply Window State
    if (data.windowState) {
      if (data.windowState.isMaximized) {
        await appWindow.maximize();
      } else {
        await appWindow.setSize(new LogicalSize(data.windowState.width, data.windowState.height));
      }
    }

    // 3. Detect Base Path (Executable Directory)
    const prefix = await settings.getBasePath();

    // 4. Load Data
    await appModel.loadData(
      prefix + 'script.yml',
      prefix + 'const.yml',
      prefix + 'db.yml'
    );
    console.log("Data loaded successfully from:", prefix);
  } catch(e: any) {
    console.error("Failed to load initial data", e);
    loadError.value = String(e?.message || e || "Unknown Error");
  }
};

const retryLoad = () => {
  doLoad();
};

let unlistenResize: any;
let unlistenMoved: any;

onMounted(async () => {
  await doLoad();
  window.addEventListener('mousemove', handleResize);
  window.addEventListener('mouseup', stopResize);

  // Monitor window state
  unlistenResize = await appWindow.onResized(() => {
    debouncedSaveWindowState();
  });
  unlistenMoved = await appWindow.onMoved(() => {
    debouncedSaveWindowState();
  });
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
  font-size: 10pt;
}
.v-application, .text-body-1, .text-body-2, .text-caption, .text-subtitle-1, .text-subtitle-2 {
  font-size: 10pt !important;
}
.v-list-item-title, .v-list-item-subtitle, .v-tab, .v-btn {
  font-size: 10pt !important;
}

/* Resizable Layout Grid */
.layout-grid {
  display: grid;
  grid-template-columns: v-bind(leftWidth + '%') auto 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pane-left, .pane-right {
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.pane-divider {
  position: relative;
  cursor: col-resize;
  z-index: 10;
  user-select: none;
  transition: background-color 0.2s;
}

.pane-divider:hover {
  background-color: #333 !important;
}

.resizer-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
</style>