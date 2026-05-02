<template>
  <v-card height="100%" class="d-flex flex-column border-0 rounded-0 overflow-hidden">
    <v-card-title class="d-flex align-center bg-secondary py-2 flex-shrink-0">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      <span>DivinePride Information</span>
      <v-spacer />
      <div class="text-caption" v-if="dpData">{{ dpServer }} Server</div>
    </v-card-title>
    
    <v-card-text class="pa-0 flex-grow-1 overflow-y-auto" v-if="dpData">
      <div class="pa-4">
        <div class="d-flex align-center">
          <div class="text-h6 text-primary">{{ dpData.name }} (ID: {{ dpData.id }})</div>
          <v-btn
            size="x-small"
            color="secondary"
            variant="tonal"
            class="ml-3"
            @click="openExternal(dpData.id)"
          >
            <v-icon size="small" class="mr-1">mdi-open-in-new</v-icon>
            View on DivinePride
          </v-btn>
        </div>
        <div class="text-subtitle-2 text-grey">AegisName: {{ dpData.aegisName }}</div>
      </div>

      <v-tabs v-model="tab" density="compact" bg-color="grey-lighten-4">
        <v-tab value="basic">Basic Info</v-tab>
        <v-tab value="stats">Stats & Limits</v-tab>
        <v-tab value="desc">Description</v-tab>
        <v-tab value="raw">Raw Data</v-tab>
      </v-tabs>

      <v-window v-model="tab" class="pa-4">
        <!-- Basic Info -->
        <v-window-item value="basic">
          <v-table density="compact" class="border">
            <tbody>
              <tr><td class="font-weight-bold" width="140">ID</td><td>{{ dpData.id }}</td></tr>
              <tr><td class="font-weight-bold">AegisName</td><td>{{ dpData.aegisName }}</td></tr>
              <tr><td class="font-weight-bold">Name</td><td>{{ dpData.name }}</td></tr>
              <tr><td class="font-weight-bold">Unidentified Name</td><td>{{ dpData.unidName }}</td></tr>
              <tr><td class="font-weight-bold">Resource Name</td><td>{{ dpData.resName }}</td></tr>
              <tr><td class="font-weight-bold">Unid Res Name</td><td>{{ dpData.unidResName }}</td></tr>
              <tr><td class="font-weight-bold">Gender</td><td>{{ dpData.gender === 0 ? 'Female' : dpData.gender === 1 ? 'Male' : 'Both' }}</td></tr>
              <tr><td class="font-weight-bold">Class Num (View)</td><td>{{ dpData.classNum }}</td></tr>
            </tbody>
          </v-table>
        </v-window-item>

        <!-- Stats & Limits -->
        <v-window-item value="stats">
          <v-table density="compact" class="border">
            <tbody>
              <tr><td class="font-weight-bold" width="140">Type</td><td>{{ dpData.itemTypeId }} ({{ getTypeName(dpData.itemTypeId) }})</td></tr>
              <tr><td class="font-weight-bold">Subtype</td><td>{{ dpData.itemSubTypeId }} ({{ getSubTypeName(dpData.itemTypeId, dpData.itemSubTypeId) }})</td></tr>
              <tr><td class="font-weight-bold">Attack</td><td>{{ dpData.attack ?? '-' }}</td></tr>
              <tr><td class="font-weight-bold">Matk</td><td>{{ dpData.matk ?? '-' }}</td></tr>
              <tr><td class="font-weight-bold">Defense</td><td>{{ dpData.defense ?? '-' }}</td></tr>
              <tr><td class="font-weight-bold">Weight</td><td>{{ dpData.weight }} (Scaled: {{ dpData.weight * 10 }})</td></tr>
              <tr><td class="font-weight-bold">Slots</td><td>{{ dpData.slots }}</td></tr>
              <tr><td class="font-weight-bold">Min Level</td><td>{{ dpData.requiredLevel ?? '-' }}</td></tr>
              <tr><td class="font-weight-bold">Max Level</td><td>{{ dpData.limitLevel ?? '-' }}</td></tr>
              <tr><td class="font-weight-bold">Range</td><td>{{ dpData.range ?? '-' }}</td></tr>
              <tr><td class="font-weight-bold">Refinable</td><td>{{ dpData.refinable ? 'Yes' : 'No' }}</td></tr>
              <tr><td class="font-weight-bold">Indestructible</td><td>{{ dpData.indestructible ? 'Yes' : 'No' }}</td></tr>
              <tr><td class="font-weight-bold">LOCA (Bitmask)</td><td>{{ dpData.LOCA }}</td></tr>
            </tbody>
          </v-table>
          
          <div class="mt-4 text-caption font-weight-bold mb-1">Movement Info</div>
          <v-table density="compact" class="border">
            <tbody>
              <tr v-for="(val, key) in dpData.itemMoveInfo" :key="key">
                <td class="font-weight-bold" width="140">{{ key }}</td>
                <td>
                  <v-icon :color="val ? 'success' : 'error'" size="small">
                    {{ val ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                  {{ val ? 'Allow' : 'Deny' }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

        <!-- Description -->
        <v-window-item value="desc">
          <div class="mb-4">
            <div class="text-caption font-weight-bold mb-1">Identified Description</div>
            <div class="pa-3 bg-white border rounded text-pre-wrap font-mono ro-text-box">
              <span v-for="(seg, i) in parseRoText(dpData.description)" :key="i" :style="{ color: seg.color }">{{ seg.text }}</span>
            </div>
          </div>
          <div>
            <div class="text-caption font-weight-bold mb-1">Unidentified Description</div>
            <div class="pa-3 bg-white border rounded text-pre-wrap font-mono ro-text-box">
              <span v-for="(seg, i) in parseRoText(dpData.unidDescription)" :key="i" :style="{ color: seg.color }">{{ seg.text }}</span>
            </div>
          </div>
        </v-window-item>

        <!-- Raw Data -->
        <v-window-item value="raw">
          <pre class="pa-2 bg-grey-lighten-4 rounded text-caption overflow-x-auto">{{ JSON.stringify(dpData, null, 2) }}</pre>
        </v-window-item>
      </v-window>
    </v-card-text>
    <v-card-text v-else class="d-flex flex-column align-center justify-center flex-grow-1 text-grey">
      <v-icon size="64" class="mb-4">mdi-magnify</v-icon>
      <div>Waiting for data from main window...</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';

const dpData = ref<any>(null);
const dpServer = ref('');
const tab = ref('basic');

const openExternal = async (id: number) => {
  try {
    await openUrl(`https://www.divine-pride.net/database/item/${id}`);
  } catch (e) {
    console.error('Failed to open external link:', e);
  }
};

const parseRoText = (text: string) => {
  if (!text) return [];
  // Split by RO color code ^RRGGBB
  const parts = text.split(/\^([0-9a-fA-F]{6})/g);
  const segments: { text: string; color?: string }[] = [];
  
  // The first part is the text before any color code
  if (parts[0]) {
    segments.push({ text: parts[0] });
  }
  
  for (let i = 1; i < parts.length; i += 2) {
    const color = parts[i];
    const content = parts[i+1] || '';
    segments.push({ text: content, color: `#${color}` });
  }
  return segments;
};

const getTypeName = (type: number) => {
  const map: Record<number, string> = {
    1: 'WEAPON', 2: 'ARMOR', 3: 'CONSUMABLE', 4: 'AMMO', 5: 'ETC', 6: 'CARD', 7: 'CASH',
    9: 'COSTUME', 10: 'SHADOWGEAR'
  };
  return map[type] || 'UNKNOWN';
};

const getSubTypeName = (type: number, subType: number) => {
  if (type === 1) { // Weapon
    const weaponMap: Record<number, string> = {
      256: 'Dagger', 257: 'One-handed Sword', 258: 'Two-handed Sword', 259: 'One-handed Spear', 260: 'Two-handed Spear',
      261: 'One-handed Axe', 262: 'Two-handed Axe', 263: 'One-handed Mace', 264: 'Two-handed Mace', 265: 'One-handed Staff',
      266: 'Two-handed Staff', 267: 'Bow', 268: 'Knuckle', 269: 'Musical', 270: 'Whip',
      271: 'Book', 272: 'Katar', 273: 'Revolver', 274: 'Rifle', 275: 'Gatling', 276: 'Shotgun',
      277: 'Grenade', 278: 'Huuma'
    };
    return weaponMap[subType] || subIdToString(subType);
  }
  if (type === 2 || type === 9 || type === 10) { // Armor, Costume, Shadow
    const armorMap: Record<number, string> = {
      512: 'Helm', 513: 'Armor', 514: 'Shield', 515: 'Garment', 516: 'Shoes', 517: 'Accessory',
      518: 'Pet', 519: 'Costume Helm', 522: 'Costume Garment', 525: 'Costume Floor',
      526: 'Shadow Armor', 527: 'Shadow Shield', 528: 'Shadow Shoes', 529: 'Shadow Right Accessory', 530: 'Shadow Left Accessory'
    };
    return armorMap[subType] || subIdToString(subType);
  }
  if (type === 4) { // Ammo
    const ammoMap: Record<number, string> = {
      1024: 'Arrow', 1025: 'Cannon Ball', 1026: 'Throw Weapon', 1027: 'Bullet'
    };
    return ammoMap[subType] || subIdToString(subType);
  }
  return subIdToString(subType);
};

const subIdToString = (id: number) => id === 0 ? 'None' : id.toString();

onMounted(async () => {
  await listen('dp-data-updated', (event: any) => {
    dpData.value = event.payload.data;
    dpServer.value = event.payload.server;
  });
});
</script>

<style scoped>
.font-mono { font-family: 'Consolas', 'Monaco', monospace; }
.ro-text-box {
  font-size: 12px;
  line-height: 1.5;
  color: #000; /* Default black for white background */
  overflow-y: visible; /* Try to expand as much as possible */
  white-space: pre-wrap;
  min-height: 100px;
}
:deep(.v-window__container) {
  height: 100% !important;
}
:deep(.v-window-item) {
  height: 100%;
}
</style>
