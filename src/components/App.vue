<template>
  <div id="mt-modal" class="mt-modal" :class="classMt" v-show="opened">
    <div class="mt-modal-content">
      <span class="mt-modal-content-close" @click="closeModal">×</span>
      <div class="mt-modal-content-header">
        <img class="mt-modal-content-header-logo" :src="iconSrc" alt="Mucho texto">
        <div class="mt-modal-content-header-wrapper-title">
          <h2 class="mt-modal-content-header-subtitle">{{ subtitle }}</h2>
          <h1 class="mt-modal-content-header-title">{{ title }}</h1>
        </div>
      </div>
      <div class="mt-modal-content-main">
        <div v-show="loading" class="mt-modal-content-loading">
          <div class="mt-modal-content-loading-loader">
            <div class="mt-loader"></div>
          </div>
          <p class="mt-modal-content-loading-text">{{ loadingText }}</p>
        </div>
        <div v-show="resultVisible" class="mt-modal-content-result">
          <div class="mt-modal-content-result-text" v-html="resultText" />
        </div>
        <div v-show="resultVisible" class="mt-modal-content-input">
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
      </div>
      <div v-show="resultVisible" class="mt-modal-content-actions">
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
import { ref, watch } from 'vue';

// Variables estaticas
const iconSrc = chrome.runtime.getURL("assets/icons/icon.png");

// Variables reactivas
const opened = ref(false);
const loading = ref(false);
const resultVisible = ref(false);
const title = ref('');
const subtitle = ref('');
const loadingText = ref('');
const resultText = ref('');
const inputValue = ref('');
const classMt = ref({});
const idChat = ref('');

// Métodos del componente
const setTitle = (data: any) => {
  const maxCaractersTitle = 400;
  if (!data.isLink && data.title.length > maxCaractersTitle) {
    const textTruncated = data.title.substring(0, maxCaractersTitle) + "...";
    title.value = textTruncated;
  } else {
    title.value = data.title;
  }

  title.subtitle = data.subtitle;

  if (data.isLink) classMt.value.link = true;
  else classMt.value.link = false;

  if (data.isSelection) classMt.value.selection = true;
  else classMt.value.selection = false;
};

const showLoading = (text) => {
  loading.value = true;
  loadingText.value = text;
}

const showError = (error: string) => {
  classMt.value.error = true;
  showInfo(error);
}

const showResult = (text) => {
  classMt.value.error = false;
  closeLoading();
  // if (!keepActions) closeActions();
  showInfo(text);
}

const openModal = () => {
  opened.value = true;
};

const closeModal = () => {
  opened.value = false;
  chrome.runtime.sendMessage({ action: 'modalClosed' });
  resetStates(); // Resetea los estados al cerrar
};

const resetStates = () => {
  loading.value = false;
  resultVisible.value = false;
  loadingText.value = '';
  resultText.value = '';
  inputValue.value = '';
};

const handleSubmit = () => {
  // Aquí puedes enviar el valor a la API
  sendDataToApi(inputValue.value);
  inputValue.value = ''; // Limpiar el campo de entrada
};

// Enviar datos a la API
const sendDataToApi = (inputValue: string) => {
  chrome.runtime.sendMessage({ action: 'reply', idChat: idChat.value, prompt: inputValue });
};

const closeLoading = () => {
  loading.value = false;
  loadingText.value = '';
};

const showInfo = (text: string) => {
  resultVisible.value = true;
  resultText.value = text;
};

const closeInfo = () => {
  resultVisible.value = false;
  resultText.value = '';
};

const showActions = (info) => {
  const { type, data } = info;

  idChat.value = data.idChat;

  // TODO
  /*
  if (["article"].includes(type)) {
    const { url } = data;
    this.addActionSpeech();
    this.addActionLink(url, "ir al artículo");
  }
  */
}

chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;

  openModal();

  if (type === "title") {
    setTitle(data);
    return;
  }

  if (type === "loading") {
    closeInfo();
    showLoading(data.text);
    return;
  }

  if (type === "error") {
    closeLoading();
    showError(data.error);
    return;
  }

  if (type === "actions") {
    closeLoading();
    showActions(data);
    return;
  }

  if (type === "action") {
    closeLoading();
    if (data.type === 'copyToTheClipboard') {
      const { text, infoText } = data.data;
      navigator.clipboard.writeText(text);(infoText);
      showInfo(infoText);
    }
    return;
  }

  openModal();
  closeLoading();
  showResult(data.text, data.chatHistory, data.keepActions);
});

</script>