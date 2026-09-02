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
        <template v-if="!loading">
          <section v-if="originalText" class="mt-modal-content-original">
            <div class="mt-modal-content-original-header">
              <strong>{{ originalTextLabel }}</strong>
              <button type="button" class="mt-modal-content-original-copy" @click="copyOriginalText">
                {{ originalCopied ? copiedLabel : copyLabel }}
              </button>
            </div>
            <p
              class="mt-modal-content-original-text"
              :class="{ expanded: originalExpanded }"
            >{{ originalText }}</p>
            <button
              v-if="originalTextCanExpand"
              type="button"
              class="mt-modal-content-original-toggle"
              @click="originalExpanded = !originalExpanded"
            >
              {{ originalExpanded ? showLessLabel : showMoreLabel }}
            </button>
          </section>
          <div class="mt-modal-content-result">
            <div
              v-for="(item, index) in info"
              :key="index"
              class="mt-modal-content-result-text"
              :class="resultItemClasses(index)"
              v-html="formatMessage(item)"
            />
          </div>
          <div v-if="!isError" class="mt-modal-content-input">
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
          <div class="mt-modal-content-actions-list">
            <button
              v-if="canFactCheck && sourceUrl && !loading"
              type="button"
              class="mt-modal-content-action-button"
              @click="emit('factCheck')"
            >{{ factCheckLabel }}</button>
            <a
              v-if="sourceUrl"
              :href="sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-modal-content-action-link"
            >{{ originalArticleLabel }}</a>
          </div>
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
import { ref, computed, watch } from 'vue';
import { isHyperlink } from '../utils/utils';
import { Info } from './interfaces'

// Props
const props = defineProps<{
  opened: boolean;
  iconUrl: string;
  title: string;
  subtitle: string;
  originalText: string;
  sourceUrl: string;
  canFactCheck: boolean;
  loading: boolean;
  loadingText: string;
  info: Array<Info>;
  isError: boolean;
}>();

// Emit
const emit = defineEmits<{
  (event: 'closeModal'): void;
  (event: 'submit', input: string): void;
  (event: 'factCheck'): void;
}>();

// Data
const inputValue = ref('');
const originalExpanded = ref(false);
const originalCopied = ref(false);
const originalTextLabel = chrome.i18n.getMessage('uiOriginalText');
const copyLabel = chrome.i18n.getMessage('uiCopy');
const copiedLabel = chrome.i18n.getMessage('uiCopied');
const showMoreLabel = chrome.i18n.getMessage('uiShowMore');
const showLessLabel = chrome.i18n.getMessage('uiShowLess');
const originalArticleLabel = chrome.i18n.getMessage('uiOriginalArticle');
const factCheckLabel = chrome.i18n.getMessage('uiFactCheckArticle');

// Computed
const titleIsLink = computed(() => {
  return isHyperlink(props.title);
});

const titleAdapted = computed(() => {
  const maxCaractersTitle = 400;

  if (!titleIsLink.value && props.title.length > maxCaractersTitle) {
    const textTruncated = props.title.substring(0, maxCaractersTitle) + "...";
    return textTruncated;
  }
  
  return props.title;
});

const originalTextCanExpand = computed(() => props.originalText.length > 300);

watch(() => props.originalText, () => {
  originalExpanded.value = false;
  originalCopied.value = false;
});

const extraClass = computed(() => {
  return {
    error: props.isError,
    link: titleIsLink.value,
  };
});

const resultItemClasses = (index: number | string) => {
  const itemIndex = Number(index);

  return {
    'mt-bt': itemIndex > 0,
    'mt-mt': itemIndex > 0,
    'mt-pt': itemIndex > 0,
    'mt-cursiva': itemIndex % 2 !== 0,
  };
};

const formatMessage = (item: Info) => {
  const escapedText = item.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  if (item.info !== 'assistant') return escapedText.replace(/\n/g, '<br>');

  return escapedText
    .replace(
      /^\*\*(Calificación rápida|Quick rating): ([^*\n]+)\*\*/,
      '<div class="mt-fact-check-rating"><span>$1</span><strong>$2</strong></div>'
    )
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/\n/g, '<br>');
};

// Metodos
const closeModal = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  emit('closeModal');
};

const handleSubmit = () => {
  emit('submit', inputValue.value);
  inputValue.value = '';
};

const copyOriginalText = async () => {
  try {
    await navigator.clipboard.writeText(props.originalText);
    originalCopied.value = true;
    window.setTimeout(() => {
      originalCopied.value = false;
    }, 1500);
  } catch {
    originalCopied.value = false;
  }
};
</script>
