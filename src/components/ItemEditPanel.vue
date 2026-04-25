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

      <!-- Type / SubType / Gender -->
      <v-row dense class="mt-1">
        <v-col cols="3">
          <v-select v-model="form.type" :items="TYPES" label="Type" density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="3">
          <v-select v-model="form.subType" :items="subTypeOptions" label="SubType" density="compact" variant="outlined" hide-details clearable :placeholder="defaultHint('SubType')" />
        </v-col>
        <v-col cols="3">
          <v-select v-model="form.gender" :items="GENDERS" label="Gender" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Gender', 'Both')" />
        </v-col>
        <v-col cols="1">
          <v-text-field v-model.number="form.slots" label="Slots" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Slots', '0')" />
        </v-col>
        <v-col cols="1">
          <v-text-field v-model.number="form.view" label="View" density="compact" variant="outlined" hide-details :placeholder="defaultHint('View', '0')" />
        </v-col>
        <v-col cols="1">
          <v-text-field v-model="form.aliasName" label="AliasName" density="compact" variant="outlined" hide-details />
        </v-col>
      </v-row>

      <!-- Numeric Stats -->
      <v-row dense class="mt-1">
        <v-col cols="2"><v-text-field v-model.number="form.buy" label="Buy" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Buy')" :bg-color="form.buy == null ? 'grey-lighten-4' : ''" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.sell" label="Sell" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Sell')" :bg-color="form.sell == null ? 'grey-lighten-4' : ''" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.weight" label="Weight" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Weight', '0')" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.attack" label="Attack" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Attack', '0')" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.magicAttack" label="MagicAttack" density="compact" variant="outlined" hide-details :placeholder="defaultHint('MagicAttack', '0')" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.defense" label="Defense" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Defense', '0')" /></v-col>
      </v-row>
      <v-row dense class="mt-1">
        <v-col cols="2"><v-text-field v-model.number="form.range" label="Range" density="compact" variant="outlined" hide-details :placeholder="defaultHint('Range', '0')" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.weaponLevel" label="WeaponLevel" density="compact" variant="outlined" hide-details :placeholder="defaultHint('WeaponLevel')" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.armorLevel" label="ArmorLevel" density="compact" variant="outlined" hide-details :placeholder="defaultHint('ArmorLevel')" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.equipLevelMin" label="EquipLevelMin" density="compact" variant="outlined" hide-details :placeholder="defaultHint('EquipLevelMin', '0')" /></v-col>
        <v-col cols="2"><v-text-field v-model.number="form.equipLevelMax" label="EquipLevelMax" density="compact" variant="outlined" hide-details :placeholder="defaultHint('EquipLevelMax', '0')" /></v-col>
        <v-col cols="2">
          <div class="d-flex gap-2 align-center mt-1">
            <v-checkbox v-model="form.refineable" label="Refineable" density="compact" hide-details />
            <v-checkbox v-model="form.gradable" label="Gradable" density="compact" hide-details />
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-2" />

      <!-- Jobs / Classes / Locations -->
      <v-row dense>
        <v-col cols="4">
          <div class="text-caption font-weight-bold mb-1">Jobs <span class="text-grey">(未選択 + Weapon/Armor → All)</span></div>
          <v-select
            v-model="form.jobs"
            :items="JOB_LIST"
            label="Jobs"
            density="compact"
            variant="outlined"
            hide-details
            multiple
            chips
            closable-chips
            class="text-caption"
          />
        </v-col>
        <v-col cols="4">
          <div class="text-caption font-weight-bold mb-1">Classes <span class="text-grey">(未選択 + Weapon/Armor → All)</span></div>
          <v-select
            v-model="form.classes"
            :items="CLASS_LIST"
            label="Classes"
            density="compact"
            variant="outlined"
            hide-details
            multiple
            chips
            closable-chips
            class="text-caption"
          />
        </v-col>
        <v-col cols="4">
          <div class="text-caption font-weight-bold mb-1">Locations</div>
          <v-select
            v-model="form.locations"
            :items="LOCATION_LIST"
            label="Locations"
            density="compact"
            variant="outlined"
            hide-details
            multiple
            chips
            closable-chips
            class="text-caption"
          />
        </v-col>
      </v-row>

      <v-divider class="my-2" />

      <!-- Flags -->
      <div class="text-caption font-weight-bold mb-1">Flags</div>
      <v-row dense>
        <v-col v-for="f in FLAG_LIST" :key="f" cols="2">
          <v-checkbox v-model="form.flags[f as keyof typeof form.flags]" :label="f" density="compact" hide-details />
        </v-col>
      </v-row>

      <v-divider class="my-2" />

      <!-- Delay / Stack / NoUse / Trade -->
      <v-row dense>
        <!-- Delay -->
        <v-col cols="3">
          <div class="text-caption font-weight-bold mb-1">Delay</div>
          <v-text-field v-model.number="form.delay.Duration" label="Duration (sec)" density="compact" variant="outlined" hide-details class="mb-1" :placeholder="defaultHint('Delay.Duration')" />
          <v-text-field v-model="form.delay.Status" label="Status" density="compact" variant="outlined" hide-details />
        </v-col>

        <!-- Stack -->
        <v-col cols="3">
          <div class="text-caption font-weight-bold mb-1">Stack</div>
          <v-text-field v-model.number="form.stack.Amount" label="Amount" density="compact" variant="outlined" hide-details class="mb-1" />
          <div class="d-flex flex-wrap gap-1">
            <v-checkbox v-for="k in ['Inventory','Cart','Storage','GuildStorage']" :key="k" v-model="form.stack[k as keyof typeof form.stack]" :label="k" density="compact" hide-details />
          </div>
        </v-col>

        <!-- NoUse -->
        <v-col cols="3">
          <div class="text-caption font-weight-bold mb-1">NoUse</div>
          <v-text-field v-model.number="form.noUse.Override" label="Override" density="compact" variant="outlined" hide-details class="mb-1" placeholder="100 (default)" :bg-color="!form.noUse.Override || form.noUse.Override === 100 ? 'grey-lighten-4' : ''" />
          <v-checkbox v-model="form.noUse.Sitting" label="Sitting" density="compact" hide-details />
        </v-col>

        <!-- Trade -->
        <v-col cols="3">
          <div class="text-caption font-weight-bold mb-1">Trade</div>
          <v-text-field v-model.number="form.trade.Override" label="Override" density="compact" variant="outlined" hide-details class="mb-1" placeholder="100 (default)" :bg-color="!form.trade.Override || form.trade.Override === 100 ? 'grey-lighten-4' : ''" />
          <div class="d-flex flex-wrap gap-1">
            <v-checkbox v-for="k in TRADE_BOOLS" :key="k" v-model="form.trade[k as keyof typeof form.trade]" :label="k" density="compact" hide-details />
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-2" />

      <!-- Scripts -->
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
          density="compact"
          variant="outlined"
          hide-details
          rows="3"
          no-resize
          class="text-caption font-mono"
          :placeholder="`${sf.label} を入力...`"
        />
      </div>

      <!-- Save Button -->
      <div class="d-flex justify-end mt-3">
        <v-btn color="success" variant="flat" :loading="saving" @click="save">
          <v-icon class="mr-1">mdi-content-save</v-icon> Save
        </v-btn>
      </div>
    </template>

    <ScriptEditorDialog ref="scriptEditorDialog" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
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

// ─── Constants ──────────────────────────────────────────────────────
const TYPES = ['Healing', 'Usable', 'Etc', 'Armor', 'Weapon', 'Card', 'PetEgg', 'PetArmor', 'Ammo', 'DelayConsume', 'ShadowGear', 'Cash'];

const WEAPON_SUBTYPES = ['Fist','Dagger','1hSword','2hSword','1hSpear','2hSpear','1hAxe','2hAxe','Mace','Staff','Bow','Knuckle','Musical','Whip','Book','Katar','Revolver','Rifle','Gatling','Shotgun','Grenade','Huuma','2hStaff'];
const AMMO_SUBTYPES = ['Arrow','Dagger','Bullet','Shell','Grenade','Shuriken','Kunai','CannonBall','ThrowWeapon'];
const CARD_SUBTYPES = ['Normal','Enchant'];

const GENDERS = ['Both', 'Female', 'Male'];

const JOB_LIST = ['All','Acolyte','Alchemist','Archer','Assassin','BardDancer','Blacksmith','Crusader','Gunslinger','Hunter','KagerouOboro','Knight','Mage','Merchant','Monk','Ninja','Novice','Priest','Rebellion','Rogue','Sage','SoulLinker','StarGladiator','Summoner','SuperNovice','Swordman','Taekwon','Thief','Wizard'];

const CLASS_LIST = ['All','Normal','Upper','Baby','Third','Third_Upper','Third_Baby','Fourth','All_Upper','All_Baby','All_Third'];

const LOCATION_LIST = ['Head_Top','Head_Mid','Head_Low','Armor','Right_Hand','Left_Hand','Garment','Shoes','Right_Accessory','Left_Accessory','Costume_Head_Top','Costume_Head_Mid','Costume_Head_Low','Costume_Garment','Ammo','Shadow_Armor','Shadow_Weapon','Shadow_Shield','Shadow_Shoes','Shadow_Right_Accessory','Shadow_Left_Accessory','Both_Hand','Both_Accessory'];

const FLAG_LIST = ['BuyingStore','DeadBranch','Container','UniqueId','BindOnEquip','DropAnnounce','NoConsume','DropEffect'];

const TRADE_BOOLS = ['NoDrop','NoTrade','TradePartner','NoSell','NoCart','NoStorage','NoGuildStorage','NoMail','NoAuction'];

const SCRIPT_FIELDS = [
  { key: 'script', label: 'Script' },
  { key: 'equipScript', label: 'EquipScript' },
  { key: 'unEquipScript', label: 'UnEquipScript' },
];

// ─── Form ────────────────────────────────────────────────────────────
const item = computed(() => appModel.currentItem.value);

interface FormData extends Omit<ItemDbEntry, 'flags' | 'delay' | 'stack' | 'noUse' | 'trade'> {
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

watch(item, (val) => {
  if (!val) return;
  Object.assign(form, {
    id: val.id, aegis_name: val.aegis_name, name: val.name, filePath: val.filePath,
    type: val.type, subType: val.subType, buy: val.buy, sell: val.sell,
    weight: val.weight, attack: val.attack, magicAttack: val.magicAttack,
    defense: val.defense, range: val.range, slots: val.slots,
    jobs: [...val.jobs], classes: [...val.classes], gender: val.gender, locations: [...val.locations],
    weaponLevel: val.weaponLevel, armorLevel: val.armorLevel,
    equipLevelMin: val.equipLevelMin, equipLevelMax: val.equipLevelMax,
    refineable: val.refineable, gradable: val.gradable, view: val.view, aliasName: val.aliasName,
    flags: { ...val.flags },
    delay: { ...val.delay },
    stack: { ...val.stack },
    noUse: { Override: 100, ...val.noUse },
    trade: { Override: 100, ...val.trade },
    script: val.script, equipScript: val.equipScript, unEquipScript: val.unEquipScript,
  });
}, { deep: false });

const subTypeOptions = computed(() => {
  if (form.type === 'Weapon') return WEAPON_SUBTYPES;
  if (form.type === 'Ammo') return AMMO_SUBTYPES;
  if (form.type === 'Card') return CARD_SUBTYPES;
  return [];
});

function defaultHint(field: string, def?: string) {
  return def ? `default: ${def}` : '';
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
    // Build item from form
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

    const result = await saveItemToYaml(toSave);
    if (result.success) {
      // メモリを更新
      const dbItem = appModel.getItems().find(i => i.aegis_name === toSave.aegis_name);
      if (dbItem) Object.assign(dbItem, toSave);
      snackbar.value = { show: true, text: 'Saved successfully', color: 'success' };
    } else {
      snackbar.value = { show: true, text: `Save failed: ${result.error}`, color: 'error' };
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' };
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.item-edit-panel {
  min-width: 0;
}
.font-mono {
  font-family: 'Consolas', 'Monaco', monospace;
}
</style>
