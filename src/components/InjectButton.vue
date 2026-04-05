<template>
  <v-btn icon color="secondary" @click="$emit('click')">
    <v-icon>mdi-arrow-right-bold</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
defineEmits(['click'])
</script>
