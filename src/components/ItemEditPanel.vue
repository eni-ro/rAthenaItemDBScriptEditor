<template>
  <div class="item-edit-panel d-flex flex-column h-100 overflow-y-auto pa-3">
    <div v-if="!item" class="text-grey text-caption d-flex align-center justify-center h-100">
      左の検索パネルからアイテムを選択してください
    </div>

    <template v-else>
      <!-- Basic Info -->
      <v-row dense>
        <v-col cols="2">
          <v-text-field v-model.number="form.id" label="Id" density="compact" variant="outlined" hide-details readonly />
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
            placeholder="(省略可)"
          />
        </v-col>
        <v-col cols="2">
          <v-select v-model="form.gender" :items="GENDERS" label="Gender" density="compact" variant="outlined" hide-details
            :bg-color="form.gender === 'Both' ? 'grey-lighten-4' : ''"
          />
        </v-col>
        <v-col cols="1">
          <v-text-field v-model.number="form.slots" label="Slots" density="compact" variant="outlined" hide-details
            :bg-color="!form.slots ? 'grey-lighten-4' : ''" placeholder="0" />
        </v-col>
        <v-col cols="1">
          <v-text-field v-model.number="form.view" label="View" density="compact" variant="outlined" hide-details
            :bg-color="form.view == null || form.view === 0 ? 'grey-lighten-4' : ''" placeholder="0" />
        </v-col>
        <v-col cols="2">
          <v-text-field v-model="form.aliasName" label="AliasName" density="compact" variant="outlined" hide-details
            :bg-color="!form.aliasName ? 'grey-lighten-4' : ''" placeholder="(省略可)" />
        </v-col>
      </v-row>

      <!-- Numeric Stats -->
      <v-row dense class="mt-1">
        <v-col cols="2"><v-text-field v-model.number="form.buy"         label="Buy"         density="compact" variant="outlined" hide-details :bg-color="form.buy == null ? 'grey-lighten-4' : ''"         placeholder="(省略可)" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.sell"        label="Sell"        density="compact" variant="outlined" hide-details :bg-color="form.sell == null ? 'grey-lighten-4' : ''"        placeholder="(省略可)" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.weight"      label="Weight"      density="compact" variant="outlined" hide-details :bg-color="!form.weight ? 'grey-lighten-4' : ''"            placeholder="0" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.attack"      label="Attack"      density="compact" variant="outlined" hide-details :bg-color="!form.attack ? 'grey-lighten-4' : ''"            placeholder="0" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.magicAttack" label="MagicAttack" density="compact" variant="outlined" hide-details :bg-color="!form.magicAttack ? 'grey-lighten-4' : ''"       placeholder="0" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.defense"     label="Defense"     density="compact" variant="outlined" hide-details :bg-color="!form.defense ? 'grey-lighten-4' : ''"           placeholder="0" /></v-col>
      </v-row>
      <v-row dense class="mt-1">
        <v-col cols="2"><v-text-field v-model.number="form.range"         label="Range"         density="compact" variant="outlined" hide-details :bg-color="!form.range ? 'grey-lighten-4' : ''"           placeholder="0" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.weaponLevel"   label="WeaponLevel"   density="compact" variant="outlined" hide-details :bg-color="form.weaponLevel == null ? 'grey-lighten-4' : ''" placeholder="(省略可)" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.armorLevel"    label="ArmorLevel"    density="compact" variant="outlined" hide-details :bg-color="form.armorLevel == null ? 'grey-lighten-4' : ''"  placeholder="(省略可)" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.equipLevelMin" label="EquipLevelMin" density="compact" variant="outlined" hide-details :bg-color="!form.equipLevelMin ? 'grey-lighten-4' : ''"       placeholder="0" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.equipLevelMax" label="EquipLevelMax" density="compact" variant="outlined" hide-details :bg-color="!form.equipLevelMax ? 'grey-lighten-4' : ''"       placeholder="0" /></v-col>
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

      <!-- Delay / Stack / NoUse / Trade (グループ表示) -->
      <v-row dense>
        <!-- Delay -->
        <v-col cols="3">
          <v-card variant="outlined" class="pa-2">
            <div class="text-caption font-weight-bold mb-1">Delay</div>
            <v-text-field v-model.number="form.delay.Duration" label="Duration (sec)" density="compact" variant="outlined" hide-details class="mb-1"
              :bg-color="!form.delay.Duration ? 'grey-lighten-4' : ''" placeholder="(省略可)" />
            <v-text-field v-model="form.delay.Status" label="Status" density="compact" variant="outlined" hide-details
              :bg-color="!form.delay.Status ? 'grey-lighten-4' : ''" placeholder="(省略可)" />
          </v-card>
        </v-col>

        <!-- Stack -->
        <v-col cols="3">
          <v-card variant="outlined" class="pa-2">
            <div class="text-caption font-weight-bold mb-1">Stack</div>
            <v-text-field v-model.number="form.stack.Amount" label="Amount" density="compact" variant="outlined" hide-details class="mb-1"
              :bg-color="!form.stack.Amount ? 'grey-lighten-4' : ''" placeholder="(省略可)" />
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
            <v-icon size="small" class="mr-1">mdi-pencil</v-icon> 詳細編集
          </v-btn>
        </div>
        <v-textarea
          v-model="form[sf.key as keyof typeof form] as string"
          density="compact" variant="outlined" hide-details rows="3" no-resize
          class="text-caption font-mono"
          :bg-color="!(form[sf.key as keyof typeof form]) ? 'grey-lighten-4' : ''"
          :placeholder="`${sf.label} を入力...`"
        />
      </div>

      <!-- Save Button -->
      <div class="d-flex justify-end mt-3">
        <v-chip v-if="isDirty" color="warning" size="small" class="mr-2">未保存の変更あり</v-chip>
        <v-btn color="success" variant="flat" :loading="saving" @click="save">
          <v-icon class="mr-1">mdi-content-save</v-icon> Save
        </v-btn>
      </div>
    </template>

    <ScriptEditorDialog ref="scriptEditorDialog" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>

    <!-- 変更破棄確認ダイアログ -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>変更を破棄しますか？</v-card-title>
        <v-card-text>現在のアイテムに未保存の変更があります。破棄して別のアイテムに移動しますか？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDialog.show = false; confirmDialog.cancel?.()">キャンセル</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDialog.show = false; confirmDialog.confirm?.()">破棄する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { useGlobals } from '../composables/useAppModel';
import ScriptEditorDialog from './ScriptEditorDialog.vue';
import { saveItemToYaml } from '../lib/DbProcessor';
import type { ItemDbEntry, ItemFlags, ItemDelay, ItemStack, ItemNoUse, ItemTrade } from '../lib/DbReader';

const appModel = useGlobals();
const scriptEditorDialog = ref<any>(null);
const saving = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });
const isDirty = ref(false);
const confirmDialog = reactive<{
  show: boolean;
  confirm?: () => void;
  cancel?: () => void;
}>({ show: false });

// ─── Constants ──────────────────────────────────────────────────────
const TYPES = ['Healing','Usable','Etc','Armor','Weapon','Card','PetEgg','PetArmor','Ammo','DelayConsume','ShadowGear','Cash'];
const WEAPON_SUBTYPES = ['Fist','Dagger','1hSword','2hSword','1hSpear','2hSpear','1hAxe','2hAxe','Mace','Staff','Bow','Knuckle','Musical','Whip','Book','Katar','Revolver','Rifle','Gatling','Shotgun','Grenade','Huuma','2hStaff'];
const AMMO_SUBTYPES = ['Arrow','Dagger','Bullet','Shell','Grenade','Shuriken','Kunai','CannonBall','ThrowWeapon'];
const CARD_SUBTYPES = ['Normal','Enchant'];
const GENDERS = ['Both','Female','Male'];
const JOB_LIST = ['All','Acolyte','Alchemist','Archer','Assassin','BardDancer','Blacksmith','Crusader','Gunslinger','Hunter','KagerouOboro','Knight','Mage','Merchant','Monk','Ninja','Novice','Priest','Rebellion','Rogue','Sage','SoulLinker','StarGladiator','Summoner','SuperNovice','Swordman','Taekwon','Thief','Wizard'];
const CLASS_LIST = ['All','Normal','Upper','Baby','Third','Third_Upper','Third_Baby','Fourth','All_Upper','All_Baby','All_Third'];
const LOCATION_LIST = ['Head_Top','Head_Mid','Head_Low','Armor','Right_Hand','Left_Hand','Garment','Shoes','Right_Accessory','Left_Accessory','Costume_Head_Top','Costume_Head_Mid','Costume_Head_Low','Costume_Garment','Ammo','Shadow_Armor','Shadow_Weapon','Shadow_Shield','Shadow_Shoes','Shadow_Right_Accessory','Shadow_Left_Accessory','Both_Hand','Both_Accessory'];
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
  weight: 0, attack: 0, magicAttack: 0, defense: 0, range: 0, slots: 0,
  jobs: [], classes: [], gender: 'Both', locations: [],
  weaponLevel: undefined, armorLevel: undefined,
  equipLevelMin: 0, equipLevelMax: 0,
  refineable: false, gradable: false, view: undefined, aliasName: undefined,
  flags: {}, delay: {}, stack: {}, noUse: { Override: 100 }, trade: { Override: 100 },
  script: '', equipScript: '', unEquipScript: '',
});

const form = reactive<FormData>(makeEmptyForm());
let _suppressDirty = false;

function loadForm(val: ItemDbEntry) {
  _suppressDirty = true;
  Object.assign(form, {
    id: val.id, aegis_name: val.aegis_name, name: val.name, filePath: val.filePath,
    type: val.type || 'Etc', subType: val.subType, buy: val.buy, sell: val.sell,
    weight: val.weight, attack: val.attack, magicAttack: val.magicAttack,
    defense: val.defense, range: val.range, slots: val.slots,
    jobs: val.jobs ? [...val.jobs] : [], classes: val.classes ? [...val.classes] : [], gender: val.gender || 'Both', locations: val.locations ? [...val.locations] : [],
    weaponLevel: val.weaponLevel, armorLevel: val.armorLevel,
    equipLevelMin: val.equipLevelMin, equipLevelMax: val.equipLevelMax,
    refineable: val.refineable || false, gradable: val.gradable || false, view: val.view, aliasName: val.aliasName,
    flags: { ...val.flags },
    delay: { ...val.delay },
    stack: { ...val.stack },
    noUse: { Override: 100, ...val.noUse },
    trade: { Override: 100, ...val.trade },
    script: val.script || '', equipScript: val.equipScript || '', unEquipScript: val.unEquipScript || '',
  });
  setTimeout(() => {
    isDirty.value = false;
    _suppressDirty = false;
  }, 50);
}

// アイテム切り替え時のdirty確認
// _ignoreNextItemChange: キャンセル時に loadItem → watch の再トリガーを防ぐフラグ
let _ignoreNextItemChange = false;

watch(item, (newVal, oldVal) => {
  if (!newVal) return;

  // キャンセルによる revert の場合はダイアログを出さずフォームを戻す
  if (_ignoreNextItemChange) {
    _ignoreNextItemChange = false;
    loadForm(newVal);
    return;
  }

  if (isDirty.value && oldVal) {
    confirmDialog.confirm = () => { loadForm(newVal); };
    confirmDialog.cancel = () => {
      // watch を再トリガーするが、フラグで止める
      _ignoreNextItemChange = true;
      // currentItem を直接元の値に戻す（SearchPanel のハイライトも復元）
      appModel.currentItem.value = oldVal;
    };
    confirmDialog.show = true;
  } else {
    loadForm(newVal);
  }
}, { deep: false });

// フォームの変更を監視してdirtyフラグを立てる
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

// ─── Jobs: Allと他の排他 ─────────────────────────────────────────────
function onJobsChange(val: string[]) {
  if (!val) { form.jobs = []; return; }
  const lastAdded = val.filter(v => !(form.jobs || []).includes(v));
  if (lastAdded.includes('All')) form.jobs = ['All'];
  else form.jobs = val.filter(v => v !== 'All');
}

// ─── Classes: Allと他の排他 ──────────────────────────────────────────
function onClassesChange(val: string[]) {
  if (!val) { form.classes = []; return; }
  const lastAdded = val.filter(v => !(form.classes || []).includes(v));
  if (lastAdded.includes('All')) form.classes = ['All'];
  else form.classes = val.filter(v => v !== 'All');
}

// ─── Locations: Both_Hand / Both_Accessory 排他 ───────────────────────
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

  form.locations = result;
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

// ─── Save ────────────────────────────────────────────────────────────
async function save() {
  if (!item.value) return;
  saving.value = true;
  try {
    const toSave: ItemDbEntry = {
      ...form,
      jobs: form.jobs,
      classes: form.classes,
      locations: form.locations,
      flags: form.flags as ItemFlags,
      delay: form.delay.Duration ? (form.delay as ItemDelay) : undefined,
      stack: form.stack.Amount ? (form.stack as ItemStack) : undefined,
      noUse: form.noUse.Sitting ? (form.noUse as ItemNoUse) : undefined,
      trade: TRADE_BOOLS.some(k => form.trade[k]) ? (form.trade as ItemTrade) : undefined,
    };

    const result = await saveItemToYaml(toSave, appModel.getEncoding());
    if (result.success) {
      const dbItem = appModel.getItems().find(i => i.aegis_name === toSave.aegis_name);
      if (dbItem) Object.assign(dbItem, toSave);
      isDirty.value = false;
      snackbar.value = { show: true, text: '保存しました', color: 'success' };
    } else {
      snackbar.value = { show: true, text: `保存失敗: ${result.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `エラー: ${e.message}`, color: 'error' };
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.item-edit-panel { min-width: 0; }
.font-mono { font-family: 'Consolas', 'Monaco', monospace; }
</style>
