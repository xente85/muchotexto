<template>
  <div v-show="opened" id="mt-modal" class="mt-modal" :class="extraClass">
    <div class="mt-modal-content">
      <span class="mt-modal-content-close" @click="closeModal">×</span>
      <div class="mt-modal-content-header">
        <img class="mt-modal-content-header-logo" :src="iconUrl" alt="Mucho texto">
        <div class="mt-modal-content-header-wrapper-title">
          <h2 class="mt-modal-content-header-subtitle">{{ subtitle }}</h2>
          <h1 class="mt-modal-content-header-title">{{ titleAdapted }}</h1>
        </div>
      </div>
      <div class="mt-modal-content-main">
        <div v-show="loading" class="mt-modal-content-loading">
          <div class="mt-modal-content-loading-loader">
            <div class="mt-loader"></div>
          </div>
          <p class="mt-modal-content-loading-text">{{ loadingText }}</p>
        </div>
        <template v-if="!loading && !isError">
          <div class="mt-modal-content-result">
            <div class="mt-modal-content-result-text" v-html="text" />
          </div>
          <div class="mt-modal-content-input">
            <form @submit.prevent="handleSubmit" aria-label="Formulario de entrada" class="mt-modal-form">
              <input 
                type="text" 
                id="mt-input-field" 
                class="mt-input-field" 
                v-model="inputValue"
                placeholder="¿Alguna pregunta?" 
                required
              />
              <button type="submit" class="mt-submit-button">Enviar</button>
            </form>
          </div>
        </template>
      </div>
      <div class="mt-modal-content-actions">
        <div class="mt-modal-content-actions-wrapper">
          <div class="mt-modal-content-actions-list"></div>
          <div>
            <a href="https://www.buymeacoffee.com/xente" target="_blank">
              <img class="mt-buymecoffee" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue';
import { isHyperlink } from '../utils/utils';

// Props
const props = defineProps<{
  opened: boolean;
  iconUrl: string;
  title: string;
  subtitle: string;
  loading: boolean;
  loadingText: string;
  text: string;
  isError: boolean;
}>();

// Emit
const emit = defineEmits<{
  (event: 'closeModal'): void;
  (event: 'submit', input: string): void;
}>();

// Data
const inputValue = ref('');

// Computed
const titleIsLink = computed(() => {
  return isHyperlink(props.title);
});

const titleAdapted = computed(() => {
  const maxCaractersTitle = 400;

  if (!titleIsLink && props.title.length > maxCaractersTitle) {
    const textTruncated = props.title.substring(0, maxCaractersTitle) + "...";
    return textTruncated;
  }
  
  return props.title;
});

const extraClass = computed(() => {
  return {
    error: props.isError,
    link: titleIsLink,
  };
});

// Metodos
const closeModal = () => {
  emit('closeModal');
};

const handleSubmit = () => {
  emit('submit', inputValue.value);
  inputValue.value = '';
};
</script>