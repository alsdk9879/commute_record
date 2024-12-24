<template lang="pug">
button(:class="['my-button', buttonType]" @click="handleClick")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onUnmounted, onMounted, nextTick, watch, computed } from 'vue';

</script>

<style scoped lang="less">

</style>
