<template>
  <div ref="containerRef" class="left-pane-grid">
    <!-- Top half: Tree/List of Built-in Scripts -->
    <div class="grid-top border-b position-relative">
      <div
        class="pa-1 bg-grey-lighten-4 d-flex align-center position-sticky top-0 z-1"
        style="z-index: 10"
      >
        <v-text-field
          v-model="scriptSearch"
          append-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          label="Search Scripts"
          variant="outlined"
          class="me-2 text-caption"
        ></v-text-field>
        <v-btn
          icon="mdi-unfold-more-horizontal"
          size="x-small"
          variant="text"
          @click="expandAll"
          title="Expand All"
        ></v-btn>
        <v-btn
          icon="mdi-unfold-less-horizontal"
          size="x-small"
          variant="text"
          @click="collapseAll"
          title="Collapse All"
        ></v-btn>
      </div>

      <v-list
        density="compact"
        open-strategy="multiple"
        v-model:opened="openedGroups"
        @update:selected="onScriptSelected"
      >
        <template v-for="cat in filteredCategories" :key="cat.name">
          <v-list-group :value="cat.name">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :title="cat.name"
                class="font-weight-bold bg-grey-lighten-5"
                density="compact"
              ></v-list-item>
            </template>
            <v-list-item
              v-for="script in cat.scripts"
              :key="script.Name"
              :title="script.Name"
              :value="script"
              color="primary"
              density="compact"
            ></v-list-item>
          </v-list-group>
        </template>
      </v-list>
    </div>

    <!-- Resizer 1 -->
    <div class="resizer" @mousedown="startResize(1)"></div>

    <!-- Middle: Params Form -->
    <div class="grid-middle pa-2 border-b bg-grey-lighten-5 position-relative">
      <h3 class="text-subtitle-2 mb-1 font-weight-bold">Parameters</h3>
      <template v-if="selectedScript">
        <v-row density="comfortable">
          <v-col
            cols="4"
            v-for="(arg, index) in selectedScript.Args"
            :key="index"
          >
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
            ></v-text-field>
          </v-col>
        </v-row>
        <div
          v-if="!selectedScript.Args || selectedScript.Args.length === 0"
          class="text-caption text-grey mt-1"
        >
          No parameters required.
        </div>
      </template>
      <div v-else class="text-caption text-grey mt-1">
        Select a script from the list above.
      </div>
    </div>

    <!-- Resizer 2 -->
    <div class="resizer" @mousedown="startResize(2)"></div>

    <!-- Bottom: Description -->
    <div class="grid-bottom pa-2 position-relative">
      <h3 class="text-subtitle-2 mb-1 font-weight-bold">Description</h3>
      <div class="text-caption" style="white-space: pre-wrap; line-height: 1.2">
        <template v-if="selectedScript">
          {{ getDesc(selectedScript.Desc) }}
        </template>
        <template v-else> Select a script to see its description. </template>
      </div>
    </div>

    <ParamSelectDialog ref="paramDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useGlobals } from "../composables/useAppModel";
import ParamSelectDialog from "./ParamSelectDialog.vue";
import type { ScriptItemConf, ScriptArgConf } from "../lib/ScriptConfReader";
import { settings } from "../lib/SettingsStore";

const appModel = useGlobals();
const scriptSearch = ref("");
const openedGroups = ref<string[]>([]);
const paramDialog = ref<InstanceType<typeof ParamSelectDialog> | null>(null);

const selectedScript = ref<ScriptItemConf | null>(null);
const argValues = ref<string[]>(["", "", "", "", "", ""]);

const emit = defineEmits(["inject"]);

// Resizable panel state
const containerRef = ref<HTMLElement | null>(null);

const topHeight = ref(settings.data.leftPaneHeights.top);
const midHeight = ref(settings.data.leftPaneHeights.mid);
const botHeight = ref(settings.data.leftPaneHeights.bot);
const isResizing = ref(0); // 0: none, 1: top-mid, 2: mid-bot

const startResize = (index: number) => {
  isResizing.value = index;
  document.body.style.cursor = "ns-resize";
  document.body.style.userSelect = "none";
};

const stopResize = () => {
  if (isResizing.value === 0) return;
  isResizing.value = 0;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  
  // Save to SettingsStore
  settings.leftPaneHeights = {
    top: topHeight.value,
    mid: midHeight.value,
    bot: botHeight.value
  };
  settings.save();
};

const handleResize = (e: MouseEvent) => {
  if (isResizing.value === 0 || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const pointerY = e.clientY - rect.top;
  const totalH = rect.height;
  const pointerPercent = (pointerY / totalH) * 100;

  const minH = 10; // Minimum percentage for each block

  if (isResizing.value === 1) {
    // Top-Mid resizer
    const maxTop = topHeight.value + midHeight.value - minH;
    const newTop = Math.max(minH, Math.min(pointerPercent, maxTop));
    const delta = newTop - topHeight.value;
    topHeight.value = newTop;
    midHeight.value -= delta;
  } else if (isResizing.value === 2) {
    // Mid-Bot resizer
    const midTopPercent = topHeight.value;
    const maxMid = midHeight.value + botHeight.value - minH;
    const newMid = Math.max(minH, Math.min(pointerPercent - midTopPercent, maxMid));
    const delta = newMid - midHeight.value;
    midHeight.value = newMid;
    botHeight.value -= delta;
  }
};

const filteredCategories = computed(() => {
  if (!scriptSearch.value) {
    return appModel.categories.value.map((c) => ({
      name: c.Category,
      scripts: c.Script,
    }));
  }

  const result = appModel.categories.value
    .map((c) => {
      return {
        name: c.Category,
        scripts: c.Script.filter((s) =>
          s.SearchString?.includes(scriptSearch.value.toLowerCase()),
        ),
      };
    })
    .filter((c) => c.scripts.length > 0);

  return result;
});

const getDesc = (desc: string | string[]) => {
  if (!desc) return "";
  return Array.isArray(desc) ? desc.join("\n") : desc;
};

const hasList = (type: string) => {
  return type !== "Value";
};

const onScriptSelected = (selectedVal: unknown) => {
  const selected = selectedVal as any[];
  if (selected && selected.length > 0) {
    const script = selected[0] as ScriptItemConf;
    if (script.Name !== selectedScript.value?.Name) {
      selectedScript.value = script;
      argValues.value = ["", "", "", "", "", ""];
      if (script.Args) {
        script.Args.forEach((arg, index) => {
          if (arg.Default) {
            argValues.value[index] = String(arg.Default);
          }
        });
      }
    }
  } else {
    selectedScript.value = null;
  }
};

const expandAll = () => {
  openedGroups.value = appModel.categories.value.map((c) => c.Category);
};

const collapseAll = () => {
  openedGroups.value = [];
};

const openParamSelect = (arg: ScriptArgConf, index: number) => {
  if (!hasList(arg.Type)) return;

  let items: { value: string; desc: string }[] = [];

  if (arg.Type === "List" && arg.ListName) {
    const constData = appModel.getConstList(arg.ListName);
    if (constData && constData.List) {
      items = constData.List.map((item) => {
        if (Array.isArray(item)) {
          return { desc: item[0], value: item[1] };
        }
        return { desc: item, value: item };
      });
    }
  } else if (arg.Type === "Item") {
    items = appModel
      .getItems()
      .map((i) => ({ value: i.aegis_name, desc: appModel.getDisplayName(i) }));
  } else if (arg.Type === "Skill") {
    items = appModel
      .getSkills()
      .map((i) => ({ value: i.aegis_name, desc: appModel.getSkillDisplayName(i) }));
  } else if (arg.Type === "Mob") {
    items = appModel
      .getMobs()
      .map((i) => ({ value: i.aegis_name, desc: i.name }));
  }

  if (paramDialog.value) {
    paramDialog.value.openDialog({
      items,
      onSelect: (val) => {
        argValues.value[index] = val;
      },
    });
  }
};

const onTriggerInject = () => {
  if (!selectedScript.value) return;
  const argsToPass = [];
  const argsDef = selectedScript.value.Args || [];
  for (let i = 0; i < argsDef.length; i++) {
    argsToPass.push(argValues.value[i] || "");
  }
  const generatedCode = appModel.makeCode(selectedScript.value, argsToPass);
  emit("inject", generatedCode);
};

onMounted(() => {
  document.addEventListener("app:trigger-inject", onTriggerInject);
  window.addEventListener("mousemove", handleResize);
  window.addEventListener("mouseup", stopResize);
});

onUnmounted(() => {
  document.removeEventListener("app:trigger-inject", onTriggerInject);
  window.removeEventListener("mousemove", handleResize);
  window.removeEventListener("mouseup", stopResize);
});

// Watch search to auto-expand when searching
watch(scriptSearch, (val) => {
  if (val) {
    expandAll();
  }
});
</script>

<style scoped>
.left-pane-grid {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}
.grid-top {
  flex: 0 0 v-bind('topHeight + "%"');
  height: v-bind('topHeight + "%"');
  min-height: 0;
  overflow-y: auto;
}
.grid-middle {
  flex: 0 0 v-bind('midHeight + "%"');
  height: v-bind('midHeight + "%"');
  min-height: 0;
  overflow-y: auto;
}
.grid-bottom {
  flex: 0 0 v-bind('botHeight + "%"');
  height: v-bind('botHeight + "%"');
  min-height: 0;
  overflow-y: auto;
}

.resizer {
  height: 4px;
  background: transparent;
  cursor: ns-resize;
  z-index: 100;
  flex: 0 0 auto;
  transition: background 0.2s;
}
.resizer:hover {
  background: var(--v-theme-primary);
  opacity: 0.5;
}
</style>
