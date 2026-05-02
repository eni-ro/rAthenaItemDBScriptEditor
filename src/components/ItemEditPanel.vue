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
          <v-col cols="4">
            <div class="d-flex align-center">
              <v-text-field v-model.number="form.id" label="Id" density="compact" variant="outlined" hide-details class="flex-grow-1" />
              <v-select
                v-model="dpServer"
                :items="['jRO', 'kRO', 'iRO', 'twRO', 'thRO', 'idRO', 'bRO']"
                density="compact"
                variant="plain"
                hide-details
                style="max-width: 70px;"
                class="ml-1 text-caption"
              />
              <v-btn
                icon="mdi-database-import"
                size="small"
                variant="tonal"
                color="secondary"
                class="ml-1"
                :loading="searchingDP"
                @click="onSearchDivinePride"
                title="Fetch from DivinePride"
              />
              <v-btn
                v-if="form.id"
                icon="mdi-open-in-new"
                size="small"
                variant="text"
                color="blue-grey"
                class="ml-1"
                title="View on DivinePride"
                @click="openExternal(form.id)"
              />
            </div>
          </v-col>
          <v-col cols="4">
            <v-text-field v-model="form.aegis_name" label="AegisName" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="4">
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
            density="compact" variant="outlined" hide-details rows="1" auto-grow max-rows="10"
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
import { saveItemToYaml, addItemToYaml, deleteItemFromYaml, fetchDivinePride } from '../lib/DbProcessor';
import { open as openFileDialog, ask } from '@tauri-apps/plugin-dialog';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';
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

// ─── DivinePride ────────────────────────────────────────────────────
const dpServer = ref('jRO');
const searchingDP = ref(false);

// ─── Constants ──────────────────────────────────────────────────────
const TYPES = ['Healing','Unknown','Usable','Etc','Armor','Weapon','Card','PetEgg','PetArmor','Unknown2','Ammo','DelayConsume','ShadowGear','Cash'];
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

async function openScriptEditor(field: string) {
  const dialog = scriptEditorDialog.value;
  if (!dialog) return;
  const current = form[field as keyof typeof form] as string || '';
  const result = await dialog.open(current);
  if (result !== null) {
    (form as any)[field] = result;
  }
}

// ─── DivinePride Search ──────────────────────────────────────────────
async function onSearchDivinePride() {
  if (!form.id) {
    snackbar.value = { show: true, text: 'Please enter an Item ID', color: 'warning' };
    return;
  }

  searchingDP.value = true;
  try {
    const apiKey = appModel.getDivinePrideKey();

    if (!apiKey) {
      snackbar.value = { show: true, text: 'DivinePride API Key is not set in Settings', color: 'error' };
      searchingDP.value = false;
      return;
    }

    const result = await fetchDivinePride(form.id, apiKey, dpServer.value);
    if (result.success && result.data) {
      const d = result.data;
      
      // Separate Window implementation
      const winLabel = 'dp-results-window';
      try {
        const existingWin = await WebviewWindow.getByLabel(winLabel);
        if (existingWin) {
          await existingWin.destroy();
        }
        // Small delay to ensure destruction
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const dpWin = new WebviewWindow(winLabel, {
          url: 'index.html?window=dp-results',
          title: 'DivinePride Information',
          width: 800,
          height: 900,
        });
        await dpWin.setFocus();
      } catch (e) {
        console.error('Failed to create DivinePride window:', e);
      }
      
      // Wait a bit for the window to be ready if it was just created
      setTimeout(async () => {
        await emit('dp-data-updated', { data: d, server: dpServer.value });
      }, 500);

      // Reflect accurate items to UI
      if (d.aegisName) form.aegis_name = d.aegisName;
      if (d.name) form.name = d.name;
      
      // 1. Item Type Mapping (DivinePride API IDs)
      const typeMap: Record<number, string> = {
        1: 'Weapon',
        2: 'Armor',
        3: 'Usable',
        4: 'Ammo',
        5: 'Etc',
        6: 'Card',
        7: 'Cash',
        9: 'Armor', // Costume (maps to Armor)
        10: 'ShadowGear'
      };
      const typeId = d.itemTypeId; // Use itemTypeId instead of type
      if (typeId != null && typeMap[typeId]) {
        form.type = typeMap[typeId];
        onTypeChange(); 
      } else if (typeId === 0) {
        // Special case for some jRO items or older data
        if (d.cardPrefix) form.type = 'Card';
        else form.type = 'Etc';
        onTypeChange();
      }

      // 2. SubType Mapping
      const subId = d.itemSubTypeId;
      if (form.type === 'Weapon') {
        const weaponMap: Record<number, string> = {
          256: 'Dagger', 257: '1hSword', 258: '2hSword', 259: '1hSpear', 260: '2hSpear',
          261: '1hAxe', 262: '2hAxe', 263: '1hMace', 264: '2hMace', 265: '1hStaff',
          266: '2hStaff', 267: 'Bow', 268: 'Knuckle', 269: 'Musical', 270: 'Whip',
          271: 'Book', 272: 'Katar', 273: 'Revolver', 274: 'Rifle', 275: 'Gatling',
          276: 'Shotgun', 277: 'Grenade', 278: 'Huuma'
        };
        form.subType = weaponMap[subId];
      } else if (form.type === 'Ammo') {
        const ammoMap: Record<number, string> = {
          1024: 'Arrow', 1025: 'CannonBall', 1026: 'ThrowWeapon', 1027: 'Bullet'
        };
        form.subType = ammoMap[subId];
      } else if (form.type === 'Card') {
        // If compositionPos is null, it's a Normal Card. Otherwise, it's an Enchant Card.
        form.subType = d.compositionPos == null ? 'Normal' : 'Enchant';
      }

      // 3. Location Mapping (Bitmask)
      if (d.LOCA != null || d.location != null) {
        const locMask = d.LOCA != null ? d.LOCA : (typeof d.location === 'number' ? d.location : 0);
        const locations: string[] = [];
        const EQP = {
          HEAD_LOW: 1, HEAD_MID: 512, HEAD_TOP: 256, HAND_R: 2, HAND_L: 32,
          ARMOR: 16, SHOES: 64, GARMENT: 4, ACC_R: 8, ACC_L: 128,
          COSTUME_HEAD_TOP: 1024, COSTUME_HEAD_MID: 2048, COSTUME_HEAD_LOW: 4096, COSTUME_GARMENT: 8192,
          AMMO: 32768, SHADOW_ARMOR: 65536, SHADOW_WEAPON: 131072, SHADOW_SHIELD: 262144,
          SHADOW_SHOES: 524288, SHADOW_ACC_R: 1048576, SHADOW_ACC_L: 2097152
        };
        
        if ((locMask & EQP.HEAD_TOP)) locations.push('Head_Top');
        if ((locMask & EQP.HEAD_MID)) locations.push('Head_Mid');
        if ((locMask & EQP.HEAD_LOW)) locations.push('Head_Low');
        if ((locMask & EQP.ARMOR)) locations.push('Armor');
        if ((locMask & EQP.GARMENT)) locations.push('Garment');
        if ((locMask & EQP.SHOES)) locations.push('Shoes');
        if ((locMask & EQP.AMMO)) locations.push('Ammo');
        
        // Hand handling
        if ((locMask & EQP.HAND_R) && (locMask & EQP.HAND_L)) locations.push('Both_Hand');
        else {
          if ((locMask & EQP.HAND_R)) locations.push('Right_Hand');
          if ((locMask & EQP.HAND_L)) locations.push('Left_Hand');
        }
        
        // Accessory handling
        if ((locMask & EQP.ACC_R) && (locMask & EQP.ACC_L)) locations.push('Both_Accessory');
        else {
          if ((locMask & EQP.ACC_R)) locations.push('Right_Accessory');
          if ((locMask & EQP.ACC_L)) locations.push('Left_Accessory');
        }
        
        // Costume
        if ((locMask & EQP.COSTUME_HEAD_TOP)) locations.push('Costume_Head_Top');
        if ((locMask & EQP.COSTUME_HEAD_MID)) locations.push('Costume_Head_MID');
        if ((locMask & EQP.COSTUME_HEAD_LOW)) locations.push('Costume_Head_LOW');
        if ((locMask & EQP.COSTUME_GARMENT)) locations.push('Costume_Garment');
        
        // Shadow
        if ((locMask & EQP.SHADOW_ARMOR)) locations.push('Shadow_Armor');
        if ((locMask & EQP.SHADOW_WEAPON)) locations.push('Shadow_Weapon');
        if ((locMask & EQP.SHADOW_SHIELD)) locations.push('Shadow_Shield');
        if ((locMask & EQP.SHADOW_SHOES)) locations.push('Shadow_Shoes');
        if ((locMask & EQP.SHADOW_ACC_R)) locations.push('Shadow_Right_Accessory');
        if ((locMask & EQP.SHADOW_ACC_L)) locations.push('Shadow_Left_Accessory');
        
        onLocationsChange(locations);
      }

      // 4. Weight (10x DP value)
      if (d.weight != null) form.weight = Number(d.weight) * 10; 
      
      // 5. Slots & Stats
      // Only set slots for Weapons and Armor (typeId 1, 2, 9, 10)
      if (typeId === 1 || typeId === 2 || typeId === 9 || typeId === 10) {
        if (d.slots != null) form.slots = Number(d.slots);
      }
      if (d.refinable != null) form.refineable = !!d.refinable;

      // Type-specific mappings
      if (typeId === 1) { // Weapon
        if (d.attack != null) form.attack = Number(d.attack);
        if (d.matk != null) form.magicAttack = Number(d.matk);
        if (d.requiredLevel != null) form.equipLevelMin = Number(d.requiredLevel);
        if (d.limitLevel != null) form.equipLevelMax = Number(d.limitLevel);
      } else if (typeId === 2 || typeId === 9) { // Armor or Costume
        if (d.defense != null) form.defense = Number(d.defense);
        if (d.requiredLevel != null) form.equipLevelMin = Number(d.requiredLevel);
        if (d.limitLevel != null) form.equipLevelMax = Number(d.limitLevel);
        if (d.classNum != null) form.view = Number(d.classNum);
      }

      // Range mapping based on setting
      const rangeSource = appModel.getDivinePrideRangeSource();
      if (rangeSource === 'api') {
        if (d.range != null) form.range = Number(d.range);
      }

      // Enchant Card Check
      const isEnchantCard = (typeId === 6 && d.compositionPos != null);

      // 6. Buy Price
      if (!isEnchantCard && d.price != null) form.buy = Number(d.price);

      // 7. Fuzzy Auto-complete
      if (appModel.getEnableFuzzyDivinePride()) {
        const desc = d.description || '';
        
        // Parse Weapon Level (Weapon only)
        if (typeId === 1) {
          // Explicitly skip RO color codes (^RRGGBB) to avoid capturing digits inside the codes
          const wlMatch = desc.match(/(?:武器レベル|Weapon Level|武器等級)\s*[:：]\s*(?:\^[0-9a-fA-F]{6})*?\s*(\d+)/i);
          if (wlMatch) {
            form.weaponLevel = parseInt(wlMatch[1]);
          }
        }
        
        // Parse Armor Level (Armor only)
        if (typeId === 2 || typeId === 9) {
          const alMatch = desc.match(/(?:防具レベル|Armor Level|防具等級)\s*[:：]\s*(?:\^[0-9a-fA-F]{6})*?\s*(\d+)/i);
          if (alMatch) {
            form.armorLevel = parseInt(alMatch[1]);
          }
        }
        
        // Default Range for Weapons (only if Source is 'fuzzy' and current UI is empty or 0)
        if (rangeSource === 'fuzzy' && typeId === 1 && (!form.range || form.range === 0)) {
          const rangeMap: Record<string, number> = {
            'Dagger': 1, '1hSword': 1, '2hSword': 1, '1hSpear': 3, '2hSpear': 3,
            '1hAxe': 1, '2hAxe': 1, '1hMace': 1, '2hMace': 1, '1hStaff': 1,
            '2hStaff': 1, 'Bow': 5, 'Knuckle': 1, 'Musical': 1, 'Whip': 2,
            'Book': 1, 'Katar': 1, 'Revolver': 7, 'Rifle': 9, 'Gatling': 9,
            'Shotgun': 9, 'Grenade': 9, 'Huuma': 1
          };
          if (form.subType && rangeMap[form.subType]) {
            form.range = rangeMap[form.subType];
          } else {
            form.range = 1; // Default for unknown weapons
          }
        }
      }

      // 8. Gender Mapping
      if (d.gender != null) {
        if (d.gender === 0) form.gender = 'Female';
        else if (d.gender === 1) form.gender = 'Male';
        else form.gender = 'Both';
      }

      // 9. Trade Mapping (itemMoveInfo)
      if (!isEnchantCard && d.itemMoveInfo) {
        const m = d.itemMoveInfo;
        form.trade = {
          ...form.trade,
          NoDrop: m.drop === false,
          NoTrade: m.trade === false,
          NoSell: m.sell === false,
          NoCart: m.cart === false,
          NoStorage: m.store === false,
          NoGuildStorage: m.guildStore === false,
          NoMail: m.mail === false,
          NoAuction: m.auction === false
        };
      }

      snackbar.value = { show: true, text: 'Data fetched and reflected from DivinePride', color: 'success' };
    } else {
      snackbar.value = { show: true, text: `DivinePride Error: ${result.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' };
  } finally {
    searchingDP.value = false;
  }
}

// ─── External Link ──────────────────────────────────────────────────
async function openExternal(id: number) {
  try {
    await openUrl(`https://www.divine-pride.net/database/item/${id}`);
  } catch (e) {}
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
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("app:request-delete-item", onDeleteItem as EventListener);
  document.removeEventListener("app:request-copy-item", onCopyItemEvent as EventListener);
  window.removeEventListener('keydown', handleKeyDown);
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key.toLowerCase() === 's') {
    if (appModel.mainTab.value !== 'items') return;
    e.preventDefault();
    if (!saving.value && (item.value || isNew.value)) {
      save();
    }
  }
}

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
    // Basic Validation
    if (!form.id) {
      snackbar.value = { show: true, text: 'Error: ID is required', color: 'error' };
      saving.value = false;
      return;
    }
    if (!form.aegis_name) {
      snackbar.value = { show: true, text: 'Error: AegisName is required', color: 'error' };
      saving.value = false;
      return;
    }
    if (!form.name) {
      snackbar.value = { show: true, text: 'Error: Name is required', color: 'error' };
      saving.value = false;
      return;
    }

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
      result = await addItemToYaml(toSave, appModel.getPythonEncoding(), {
        sort_on_insert: appModel.getSortOnInsert(),
      });
      if (result.success) {
        appModel.addItemToMemory(toSave);
        appModel.loadItem(toSave.aegis_name);
        isNew.value = false;
        isDirty.value = false;
        snackbar.value = { show: true, text: 'Created and saved successfully', color: 'success' };
      } else {
        snackbar.value = { show: true, text: `Failed to create: ${result.error}`, color: 'error' };
      }
    } else {
      result = await saveItemToYaml(toSave, appModel.getPythonEncoding(), originalAegisName.value, {
        sort_on_update: appModel.getSortOnUpdate(),
      });
      if (result.success) {
        appModel.updateItemInMemory(toSave, originalAegisName.value);
        originalAegisName.value = toSave.aegis_name;
        isDirty.value = false;
        snackbar.value = { show: true, text: 'Saved successfully', color: 'success' };
      } else {
        snackbar.value = { show: true, text: `Failed to save: ${result.error}`, color: 'error' };
      }
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
