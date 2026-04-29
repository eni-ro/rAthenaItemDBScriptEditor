<template>
  <div class="item-edit-panel pa-3" style="position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden;">
    <!-- New Item Button -->
    <div class="d-flex align-center mb-3 flex-shrink-0">
      <span class="text-subtitle-2 font-weight-bold">{{ isNew ? 'Create New Item' : 'Edit Item' }}</span>
      <v-spacer />
      <v-btn size="small" color="primary" variant="tonal" @click="startNew">
        <v-icon size="small" class="mr-1">mdi-plus</v-icon> New
      </v-btn>
    </div>

    <div v-if="!item && !isNew" class="text-grey text-caption d-flex align-center justify-center flex-grow-1">
      Please select an item from the search panel on the left or click "New".
    </div>

    <template v-else>
      <div class="flex-grow-1 overflow-y-auto pr-2" style="min-height: 0; flex: 1 1 auto;">
        <!-- Target File (new only) -->
        <div v-if="isNew" class="mb-3">
          <div class="text-caption font-weight-bold mb-1">Target File</div>
          <div class="d-flex align-center">
            <v-combobox
              v-model="targetFile"
              :items="appModel.getItemFiles()"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="path to item_db.yml"
              class="text-caption flex-grow-1"
            />
            <v-btn icon="mdi-folder-open" size="small" variant="text" class="ml-1" @click="browseFile" />
          </div>
        </div>

        <!-- Basic Info -->
        <v-row dense>
          <v-col cols="2">
            <v-text-field v-model.number="form.id" label="Id" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="4">
            <v-text-field v-model="form.aegis_name" label="AegisName" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.name" label="Name" density="compact" variant="outlined" hide-details />
          </v-col>
        </v-row>

        <!-- Type / SubType / Gender / Slots / View / AliasName -->
        <v-row dense class="mt-1">
          <v-col cols="3">
            <v-select v-model="form.type" :items="TYPES" label="Type" density="compact" variant="outlined" hide-details @update:model-value="onTypeChange" />
          </v-col>
          <v-col cols="3">
            <v-select
              v-model="form.subType" :items="subTypeOptions" label="SubType"
              density="compact" variant="outlined" hide-details clearable
              :bg-color="form.subType == null ? 'grey-lighten-4' : ''"
              placeholder="(Optional)"
            />
          </v-col>
          <v-col cols="2">
            <v-select v-model="form.gender" :items="GENDERS" label="Gender" density="compact" variant="outlined" hide-details
              :bg-color="form.gender === 'Both' ? 'grey-lighten-4' : ''"
            />
          </v-col>
          <v-col cols="1">
            <v-text-field v-model.number="form.slots" label="Slots" density="compact" variant="outlined" hide-details
              :bg-color="form.slots == null ? 'grey-lighten-4' : ''" placeholder="0" />
          </v-col>
          <v-col cols="1">
            <v-text-field v-model.number="form.view" label="View" density="compact" variant="outlined" hide-details
              :bg-color="form.view == null || form.view === 0 ? 'grey-lighten-4' : ''" placeholder="0" />
          </v-col>
          <v-col cols="2">
            <v-text-field v-model="form.aliasName" label="AliasName" density="compact" variant="outlined" hide-details
              :bg-color="!form.aliasName ? 'grey-lighten-4' : ''" placeholder="(Optional)" />
          </v-col>
        </v-row>

        <!-- Numeric Stats -->
        <v-row dense class="mt-1">
          <v-col cols="2"><v-text-field v-model.number="form.buy"         label="Buy"         density="compact" variant="outlined" hide-details :bg-color="form.buy == null ? 'grey-lighten-4' : ''"         placeholder="(Optional)" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.sell"        label="Sell"        density="compact" variant="outlined" hide-details :bg-color="form.sell == null ? 'grey-lighten-4' : ''"        placeholder="(Optional)" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.weight"      label="Weight"      density="compact" variant="outlined" hide-details :bg-color="form.weight == null ? 'grey-lighten-4' : ''"      placeholder="0" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.attack"      label="Attack"      density="compact" variant="outlined" hide-details :bg-color="form.attack == null ? 'grey-lighten-4' : ''"      placeholder="0" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.magicAttack" label="MagicAttack" density="compact" variant="outlined" hide-details :bg-color="form.magicAttack == null ? 'grey-lighten-4' : ''" placeholder="0" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.defense"     label="Defense"     density="compact" variant="outlined" hide-details :bg-color="form.defense == null ? 'grey-lighten-4' : ''"     placeholder="0" /></v-col>
        </v-row>
        <v-row dense class="mt-1">
          <v-col cols="2"><v-text-field v-model.number="form.range"         label="Range"         density="compact" variant="outlined" hide-details :bg-color="form.range == null ? 'grey-lighten-4' : ''"           placeholder="0" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.weaponLevel"   label="WeaponLevel"   density="compact" variant="outlined" hide-details :bg-color="form.weaponLevel == null ? 'grey-lighten-4' : ''" placeholder="(Optional)" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.armorLevel"    label="ArmorLevel"    density="compact" variant="outlined" hide-details :bg-color="form.armorLevel == null ? 'grey-lighten-4' : ''"  placeholder="(Optional)" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.equipLevelMin" label="EquipLevelMin" density="compact" variant="outlined" hide-details :bg-color="form.equipLevelMin == null ? 'grey-lighten-4' : ''"       placeholder="0" /></v-col>
          <v-col cols="2"><v-text-field v-model.number="form.equipLevelMax" label="EquipLevelMax" density="compact" variant="outlined" hide-details :bg-color="form.equipLevelMax == null ? 'grey-lighten-4' : ''"       placeholder="0" /></v-col>
          <v-col cols="2">
            <div class="d-flex align-center gap-2 mt-1">
              <v-checkbox v-model="form.refineable" label="Refineable" density="compact" hide-details />
              <v-checkbox v-model="form.gradable"   label="Gradable"   density="compact" hide-details />
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-2" />

        <!-- Jobs / Classes / Locations -->
        <v-row dense>
          <!-- Jobs -->
          <v-col cols="4">
            <div class="text-caption font-weight-bold mb-1">Jobs</div>
            <v-select
              :model-value="form.jobs"
              @update:model-value="onJobsChange"
              :items="JOB_LIST" label="Jobs" density="compact" variant="outlined" hide-details
              multiple chips closable-chips class="text-caption"
            />
          </v-col>

          <!-- Classes -->
          <v-col cols="4">
            <div class="text-caption font-weight-bold mb-1">Classes</div>
            <v-select
              :model-value="form.classes"
              @update:model-value="onClassesChange"
              :items="CLASS_LIST" label="Classes" density="compact" variant="outlined" hide-details
              multiple chips closable-chips class="text-caption"
            />
          </v-col>

          <!-- Locations -->
          <v-col cols="4">
            <div class="text-caption font-weight-bold mb-1">Locations</div>
            <v-select
              :model-value="form.locations"
              @update:model-value="onLocationsChange"
              :items="LOCATION_LIST" label="Locations" density="compact" variant="outlined" hide-details
              multiple chips closable-chips class="text-caption"
            />
          </v-col>
        </v-row>

        <v-divider class="my-2" />

        <!-- Flags -->
        <div class="text-caption font-weight-bold mb-1">Flags</div>
        <v-row dense>
          <v-col v-for="f in FLAG_LIST" :key="f" cols="2">
            <v-checkbox v-model="form.flags[f]" :label="f" density="compact" hide-details />
          </v-col>
        </v-row>

        <v-divider class="my-2" />

        <!-- Delay / Stack / NoUse / Trade (Group Display) -->
        <v-row dense>
          <!-- Delay -->
          <v-col cols="3">
            <v-card variant="outlined" class="pa-2">
              <div class="text-caption font-weight-bold mb-1">Delay</div>
              <v-text-field v-model.number="form.delay.Duration" label="Duration (sec)" density="compact" variant="outlined" hide-details class="mb-1"
                :bg-color="form.delay.Duration == null ? 'grey-lighten-4' : ''" placeholder="(Optional)" />
              <v-text-field v-model="form.delay.Status" label="Status" density="compact" variant="outlined" hide-details
                :bg-color="!form.delay.Status ? 'grey-lighten-4' : ''" placeholder="(Optional)" />
            </v-card>
          </v-col>

          <!-- Stack -->
          <v-col cols="3">
            <v-card variant="outlined" class="pa-2">
              <div class="text-caption font-weight-bold mb-1">Stack</div>
              <v-text-field v-model.number="form.stack.Amount" label="Amount" density="compact" variant="outlined" hide-details class="mb-1"
                :bg-color="form.stack.Amount == null ? 'grey-lighten-4' : ''" placeholder="(Optional)" />
              <div class="d-flex flex-wrap gap-1">
                <v-checkbox v-for="k in ['Inventory','Cart','Storage','GuildStorage']" :key="k"
                  v-model="(form.stack as any)[k]" :label="k" density="compact" hide-details />
              </div>
            </v-card>
          </v-col>

          <!-- NoUse -->
          <v-col cols="3">
            <v-card variant="outlined" class="pa-2">
              <div class="text-caption font-weight-bold mb-1">NoUse</div>
              <v-text-field v-model.number="form.noUse.Override" label="Override" density="compact" variant="outlined" hide-details class="mb-1"
                :bg-color="!form.noUse.Override || form.noUse.Override === 100 ? 'grey-lighten-4' : ''" placeholder="100 (default)" />
              <v-checkbox v-model="form.noUse.Sitting" label="Sitting" density="compact" hide-details />
            </v-card>
          </v-col>

          <!-- Trade -->
          <v-col cols="3">
            <v-card variant="outlined" class="pa-2">
              <div class="text-caption font-weight-bold mb-1">Trade</div>
              <v-text-field v-model.number="form.trade.Override" label="Override" density="compact" variant="outlined" hide-details class="mb-1"
                :bg-color="!form.trade.Override || form.trade.Override === 100 ? 'grey-lighten-4' : ''" placeholder="100 (default)" />
              <div class="d-flex flex-wrap gap-1">
                <v-checkbox v-for="k in TRADE_BOOLS" :key="k"
                  v-model="(form.trade as any)[k]" :label="k" density="compact" hide-details />
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-2" />

        <!-- Script fields -->
        <div v-for="sf in SCRIPT_FIELDS" :key="sf.key" class="mb-2">
          <div class="d-flex align-center mb-1">
            <span class="text-caption font-weight-bold">{{ sf.label }}</span>
            <v-spacer />
            <v-btn size="x-small" variant="tonal" @click="openScriptEditor(sf.key)">
              <v-icon size="small" class="mr-1">mdi-pencil</v-icon> Edit Script
            </v-btn>
          </div>
          <v-textarea
            v-model="form[sf.key as keyof typeof form] as string"
            density="compact" variant="outlined" hide-details rows="3" no-resize
            class="text-caption font-mono"
            :bg-color="!(form[sf.key as keyof typeof form]) ? 'grey-lighten-4' : ''"
            :placeholder="`Enter ${sf.label}...`"
          />
        </div>
      </div>

      <!-- Save Button -->
      <div class="d-flex justify-space-between mt-3 flex-shrink-0">
        <v-btn v-if="!isNew && item" color="error" variant="tonal" :loading="deleting" @click="onDeleteItem">
          <v-icon class="mr-1">mdi-delete</v-icon> Delete
        </v-btn>
        <v-spacer />
        <v-chip v-if="isDirty" color="warning" size="small" class="mr-2">Unsaved changes</v-chip>
        <v-btn color="success" variant="flat" :loading="saving" @click="save">
          <v-icon class="mr-1">mdi-content-save</v-icon> Save
        </v-btn>
      </div>
    </template>

    <ScriptEditorDialog ref="scriptEditorDialog" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>

    <!-- Discard Changes Confirmation Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>Discard changes?</v-card-title>
        <v-card-text>Current item has unsaved changes. Discard and move to another item?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDialog.show = false; confirmDialog.cancel?.()">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDialog.show = false; confirmDialog.confirm?.()">Discard</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
import { useGlobals } from '../composables/useAppModel';
import ScriptEditorDialog from './ScriptEditorDialog.vue';
import { saveItemToYaml, addItemToYaml, deleteItemFromYaml } from '../lib/DbProcessor';
import { open as openFileDialog, ask } from '@tauri-apps/plugin-dialog';
import type { ItemDbEntry, ItemFlags, ItemDelay, ItemStack, ItemNoUse, ItemTrade } from '../lib/DbReader';

const appModel = useGlobals();
const scriptEditorDialog = ref<any>(null);
const saving = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });
const isDirty = ref(false);
const isNew = ref(false);
const targetFile = ref('');
const deleting = ref(false);
const originalAegisName = ref('');
const confirmDialog = reactive<{
  show: boolean;
  confirm?: () => void;
  cancel?: () => void;
}>({ show: false });

// ─── Constants ──────────────────────────────────────────────────────
const TYPES = ['Healing','Usable','Etc','Armor','Weapon','Card','PetEgg','PetArmor','Ammo','DelayConsume','ShadowGear','Cash'];
const WEAPON_SUBTYPES = ['Fist','Dagger','1hSword','2hSword','1hSpear','2hSpear','1hAxe','2hAxe','Mace','2hMace','Staff','2hStaff','Bow','Knuckle','Musical','Whip','Book','Katar','Revolver','Rifle','Gatling','Shotgun','Grenade','Huuma'];
const AMMO_SUBTYPES = ['Arrow','Dagger','Bullet','Shell','Grenade','Shuriken','Kunai','CannonBall','ThrowWeapon'];
const CARD_SUBTYPES = ['Normal','Enchant'];
const GENDERS = ['Both','Male','Female'];
const JOB_LIST = ['All','Novice','Swordman','Knight','Crusader','Merchant','Blacksmith','Alchemist','Thief','Assassin','Rogue','Mage','Wizard','Sage','Acolyte','Priest','Monk','Archer','Hunter','BardDancer','SuperNovice','Taekwon','StarGladiator','SoulLinker','Gunslinger','Rebellion','Ninja','KagerouOboro','Druid','Karnos','Summoner','Spirit_Handler'];
const CLASS_LIST = ['All','Normal','Upper','All_Upper','Third','Third_Upper','All_Third','Fourth','Baby','Third_Baby','All_Baby'];
const LOCATION_LIST = ['Head_Top','Head_Mid','Head_Low','Armor','Right_Hand','Left_Hand','Both_Hand','Garment','Shoes','Both_Accessory','Right_Accessory','Left_Accessory','Costume_Head_Top','Costume_Head_Mid','Costume_Head_Low','Shadow_Armor','Costume_Garment','Shadow_Weapon','Shadow_Shield','Shadow_Shoes','Shadow_Right_Accessory','Shadow_Left_Accessory','Ammo'];
const FLAG_LIST = ['BuyingStore','DeadBranch','Container','UniqueId','BindOnEquip','DropAnnounce','NoConsume','DropEffect'] as const;
const TRADE_BOOLS = ['NoDrop','NoTrade','TradePartner','NoSell','NoCart','NoStorage','NoGuildStorage','NoMail','NoAuction'];
const SCRIPT_FIELDS = [
  { key: 'script', label: 'Script' },
  { key: 'equipScript', label: 'EquipScript' },
  { key: 'unEquipScript', label: 'UnEquipScript' },
];

// ─── Form ────────────────────────────────────────────────────────────
const item = computed(() => appModel.currentItem.value);

interface FormData extends Omit<ItemDbEntry, 'flags' | 'delay' | 'stack' | 'noUse' | 'trade' | 'jobs' | 'classes' | 'locations'> {
  jobs: string[];
  classes: string[];
  locations: string[];
  flags: Partial<ItemFlags>;
  delay: Partial<ItemDelay>;
  stack: Partial<ItemStack> & Record<string, any>;
  noUse: Partial<ItemNoUse>;
  trade: Partial<ItemTrade> & Record<string, any>;
}

const makeEmptyForm = (): FormData => ({
  id: 0, aegis_name: '', name: '', filePath: '',
  type: 'Etc', subType: undefined, buy: undefined, sell: undefined,
  weight: undefined, attack: undefined, magicAttack: undefined, defense: undefined, range: undefined, slots: undefined,
  jobs: [], classes: [], gender: 'Both', locations: [],
  weaponLevel: undefined, armorLevel: undefined,
  equipLevelMin: undefined, equipLevelMax: undefined,
  refineable: undefined, gradable: undefined, view: undefined, aliasName: undefined,
  flags: {}, delay: {}, stack: {}, noUse: {}, trade: {},
  script: '', equipScript: '', unEquipScript: '',
});

const form = reactive<FormData>(makeEmptyForm());
let _suppressDirty = false;

function loadForm(val: ItemDbEntry) {
  _suppressDirty = true;
  originalAegisName.value = val.aegis_name;
  Object.assign(form, {
    id: val.id, aegis_name: val.aegis_name, name: val.name, filePath: val.filePath,
    type: val.type || 'Etc', subType: val.subType, buy: val.buy, sell: val.sell,
    weight: val.weight, attack: val.attack, magicAttack: val.magicAttack,
    defense: val.defense, range: val.range, slots: val.slots,
    jobs: val.jobs ? [...val.jobs].sort((a, b) => JOB_LIST.indexOf(a) - JOB_LIST.indexOf(b)) : [],
    classes: val.classes ? [...val.classes].sort((a, b) => CLASS_LIST.indexOf(a) - CLASS_LIST.indexOf(b)) : [],
    gender: val.gender || 'Both',
    locations: val.locations ? [...val.locations].sort((a, b) => LOCATION_LIST.indexOf(a) - LOCATION_LIST.indexOf(b)) : [],
    weaponLevel: val.weaponLevel, armorLevel: val.armorLevel,
    equipLevelMin: val.equipLevelMin, equipLevelMax: val.equipLevelMax,
    refineable: val.refineable, gradable: val.gradable, view: val.view, aliasName: val.aliasName,
    flags: { ...val.flags },
    delay: { ...val.delay },
    stack: { ...val.stack },
    noUse: { ...val.noUse },
    trade: { ...val.trade },
    script: val.script || '', equipScript: val.equipScript || '', unEquipScript: val.unEquipScript || '',
  });
  setTimeout(() => {
    isDirty.value = false;
    _suppressDirty = false;
  }, 50);
}

// Check for dirty state when switching items
// _ignoreNextItemChange: Flag to prevent re-triggering watch when reverting due to cancellation
let _ignoreNextItemChange = false;

watch(item, (newVal, oldVal) => {
  // When reverting due to cancellation, we don't want to reload the form because it contains the unsaved changes.
  if (_ignoreNextItemChange) {
    _ignoreNextItemChange = false;
    return;
  }
  if (!newVal) return;

  if (isDirty.value && (oldVal || isNew.value)) {
    confirmDialog.confirm = () => { 
      isNew.value = false;
      loadForm(newVal); 
    };
    confirmDialog.cancel = () => {
      // Re-trigger watch but stop it with the flag
      _ignoreNextItemChange = true;
      // Directly revert currentItem to its original value (also restores SearchPanel highlight)
      appModel.currentItem.value = oldVal;
    };
    confirmDialog.show = true;
  } else {
    _suppressDirty = true;
    isNew.value = false;
    loadForm(newVal);
  }
}, { deep: false });

// Monitor form changes and set dirty flag
watch(() => JSON.stringify(form), () => {
  if (!_suppressDirty) isDirty.value = true;
}, { deep: true });

const subTypeOptions = computed(() => {
  if (form.type === 'Weapon') return WEAPON_SUBTYPES;
  if (form.type === 'Ammo') return AMMO_SUBTYPES;
  if (form.type === 'Card') return CARD_SUBTYPES;
  return [];
});

function onTypeChange() { form.subType = undefined; }

// ─── Jobs: Exclusive selection for "All" ─────────────────────────────
function onJobsChange(val: string[]) {
  if (!val) { form.jobs = []; return; }
  const lastAdded = val.filter(v => !(form.jobs || []).includes(v));
  let result: string[];
  if (lastAdded.includes('All')) result = ['All'];
  else result = val.filter(v => v !== 'All');
  form.jobs = result.sort((a, b) => JOB_LIST.indexOf(a) - JOB_LIST.indexOf(b));
}

// ─── Classes: Exclusive selection for "All" ──────────────────────────
function onClassesChange(val: string[]) {
  if (!val) { form.classes = []; return; }
  const lastAdded = val.filter(v => !(form.classes || []).includes(v));
  let result: string[];
  if (lastAdded.includes('All')) result = ['All'];
  else result = val.filter(v => v !== 'All');
  form.classes = result.sort((a, b) => CLASS_LIST.indexOf(a) - CLASS_LIST.indexOf(b));
}

// ─── Locations: Exclusive selection for "Both_Hand" / "Both_Accessory" ───
function onLocationsChange(val: string[]) {
  if (!val) { form.locations = []; return; }
  const lastAdded = val.filter(v => !(form.locations || []).includes(v));
  let result = [...val];

  // Both_Hand が選ばれたら Right_Hand / Left_Hand を除外
  if (lastAdded.includes('Both_Hand')) {
    result = result.filter(v => v !== 'Right_Hand' && v !== 'Left_Hand');
  } else if (lastAdded.some(v => v === 'Right_Hand' || v === 'Left_Hand')) {
    result = result.filter(v => v !== 'Both_Hand');
  }
  // Both_Accessory が選ばれたら Right_Accessory / Left_Accessory を除外
  if (lastAdded.includes('Both_Accessory')) {
    result = result.filter(v => v !== 'Right_Accessory' && v !== 'Left_Accessory');
  } else if (lastAdded.some(v => v === 'Right_Accessory' || v === 'Left_Accessory')) {
    result = result.filter(v => v !== 'Both_Accessory');
  }

  form.locations = result.sort((a, b) => LOCATION_LIST.indexOf(a) - LOCATION_LIST.indexOf(b));
}

// ─── Script Editor ───────────────────────────────────────────────────
async function openScriptEditor(field: string) {
  const dialog = scriptEditorDialog.value;
  if (!dialog) return;
  const current = form[field as keyof typeof form] as string || '';
  const result = await dialog.open(current);
  if (result !== null) {
    (form as any)[field] = result;
  }
}

// ─── Start New Item ──────────────────────────────────────────────────
async function startNew() {
  if (isDirty.value) {
    const confirmed = await ask('Current item has unsaved changes. Discard and create a new item?', {
      title: 'rAthena Item DB Editor',
      kind: 'warning',
    });
    if (!confirmed) return;
  }
  isNew.value = true;
  appModel.currentItem.value = null;
  originalAegisName.value = '';
  _suppressDirty = true;
  Object.assign(form, makeEmptyForm());
  const files = appModel.getItemFiles();
  targetFile.value = files.length > 0 ? files[0] : '';
  setTimeout(() => { isDirty.value = false; _suppressDirty = false; }, 50);
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

async function onCopyItemEvent() {
  const current = appModel.currentItem.value;
  if (!current) return;

  if (isDirty.value) {
    const confirmed = await ask('Current item has unsaved changes. Discard and copy item?', {
      title: 'rAthena Item DB Editor',
      kind: 'warning',
    });
    if (!confirmed) return;
  }
  
  const copyData = JSON.parse(JSON.stringify(current));
  
  // Revert selection so that it's no longer tracking the copied item
  appModel.currentItem.value = null;
  
  isNew.value = true;
  loadForm(copyData);
  originalAegisName.value = ''; // clear original to avoid overwriting
  const files = appModel.getItemFiles();
  targetFile.value = copyData.filePath || (files.length > 0 ? files[0] : '');
  
  setTimeout(() => {
    isDirty.value = true; // Mark dirty so user knows it's unsaved copy
    _suppressDirty = false;
  }, 50);
}

onMounted(() => {
  document.addEventListener("app:request-delete-item", onDeleteItem as EventListener);
  document.addEventListener("app:request-copy-item", onCopyItemEvent as EventListener);
});

onUnmounted(() => {
  document.removeEventListener("app:request-delete-item", onDeleteItem as EventListener);
  document.removeEventListener("app:request-copy-item", onCopyItemEvent as EventListener);
});

async function onDeleteItem() {
  if (!item.value) return;
  const confirmed = await ask('Are you sure you want to delete this item?', { 
    title: 'rAthena Item DB Editor',
    kind: 'warning',
  });
  if (!confirmed) return;
  deleting.value = true;
  try {
    const result = await deleteItemFromYaml(item.value.filePath, item.value.aegis_name, appModel.getPythonEncoding());
    if (result.success) {
      appModel.deleteItemFromMemory(item.value.filePath, item.value.aegis_name);
      appModel.currentItem.value = null;
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

// ─── Save ────────────────────────────────────────────────────────────
async function save() {
  if (!isNew.value && !item.value) return;
  saving.value = true;
  try {
    const toSave: ItemDbEntry = {
      ...form,
      filePath: isNew.value ? targetFile.value : item.value!.filePath,
      jobs: form.jobs,
      classes: form.classes,
      locations: form.locations,
      flags: form.flags as ItemFlags,
      delay: form.delay.Duration ? (form.delay as ItemDelay) : undefined,
      stack: form.stack.Amount ? (form.stack as ItemStack) : undefined,
      noUse: form.noUse.Sitting ? (form.noUse as ItemNoUse) : undefined,
      trade: TRADE_BOOLS.some(k => form.trade[k]) ? (form.trade as ItemTrade) : undefined,
    };

    // Validation: Check for duplicate ID or AegisName in the same file
    const itemsList = appModel.getItems();
    const duplicateIdItem = itemsList.find(i => 
      i.id === toSave.id && 
      i.filePath === toSave.filePath && 
      (isNew.value || i.aegis_name !== originalAegisName.value)
    );

    if (duplicateIdItem) {
      snackbar.value = { 
        show: true, 
        text: `Error: ID ${toSave.id} already exists in this file (AegisName: ${duplicateIdItem.aegis_name})`, 
        color: 'error' 
      };
      saving.value = false;
      return;
    }

    const duplicateAegisItem = itemsList.find(i => 
      i.aegis_name === toSave.aegis_name && 
      i.filePath === toSave.filePath && 
      (isNew.value || i.aegis_name !== originalAegisName.value)
    );

    if (duplicateAegisItem) {
      snackbar.value = { 
        show: true, 
        text: `Error: AegisName "${toSave.aegis_name}" already exists in this file (ID: ${duplicateAegisItem.id})`, 
        color: 'error' 
      };
      saving.value = false;
      return;
    }

    let result;
    if (isNew.value) {
      if (!targetFile.value) {
        snackbar.value = { show: true, text: 'Please specify a target file', color: 'error' };
        saving.value = false;
        return;
      }
      result = await addItemToYaml(toSave, appModel.getPythonEncoding());
      if (result.success) {
        appModel.addItemToMemory(toSave);
        appModel.loadItem(toSave.aegis_name);
        isNew.value = false;
      }
    } else {
      result = await saveItemToYaml(toSave, appModel.getPythonEncoding(), originalAegisName.value);
      if (result.success) {
        appModel.updateItemInMemory(toSave, originalAegisName.value);
        originalAegisName.value = toSave.aegis_name;
      }
    }

    if (result.success) {
      isDirty.value = false;
      snackbar.value = { show: true, text: 'Saved', color: 'success' };
    } else {
      snackbar.value = { show: true, text: `Failed to save: ${result.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' };
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.item-edit-panel { min-width: 0; }
.font-mono { font-family: 'Consolas', 'Monaco', monospace; }
</style>
