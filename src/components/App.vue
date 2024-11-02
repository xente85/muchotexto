<template>
  <div id="mt-modal" class="mt-modal" v-show="opened">
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
        <div v-if="loading" class="mt-modal-content-loading">
          <div class="mt-modal-content-loading-loader">
            <div class="mt-loader"></div>
          </div>
          <p class="mt-modal-content-loading-text">{{ loadingText }}</p>
        </div>
        <div v-if="resultVisible" class="mt-modal-content-result">
          <p class="mt-modal-content-result-text">{{ resultText }}</p>
        </div>
        <div class="mt-modal-content-input">
          <form @submit.prevent="handleSubmit" aria-label="Formulario de entrada">
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
import { ref, watch } from 'vue';

// Props del componente
const props = defineProps<{}>();

const emit = defineEmits<{
  (event: 'closeModal'): void;
}>();

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

// Métodos del componente
const openModalTitle = (data: any) => {
  const maxCaractersTitle = 400;
  if (!data.isLink && data.title.length > maxCaractersTitle) {
    const textTruncated = data.title.substring(0, maxCaractersTitle) + "...";
    title.value = textTruncated;
  } else {
    title.value = data.title;
  }

  title.subtitle = data.subtitle;

  // if (data.isLink) this.getElementContentTitle().classList.add("link");
  // else this.getElementContentTitle().classList.remove("link");

  // if (data.isSelection) this.getElementContentTitle().classList.add("selection");
  // else this.getElementContentTitle().classList.remove("selection");

  openModal();
};

const openModalLoading = (text) => {
  showLoading(text);
  openModal();
}

const openModal = () => {
  opened.value = true;
};

const closeModal = () => {
  opened.value = false;
  emit('closeModal');
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
  chrome.runtime.sendMessage({ action: 'reply', prompt: inputValue });
};

// Otras funciones para mostrar y ocultar contenido
const showLoading = (text: string) => {
  loading.value = true;
  loadingText.value = text;
};

const closeLoading = () => {
  loading.value = false;
  loadingText.value = '';
};

const showResult = (text: string) => {
  resultVisible.value = true;
  resultText.value = text;
};

const closeResult = () => {
  resultVisible.value = false;
  resultText.value = '';
};

// Watch para controlar la apertura y cierre del modal
watch(opened, (newValue) => {
  if (newValue) {
    // Aquí puedes manejar la lógica adicional al abrir el modal
  }
});


chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;

  if (type === "title") {
    openModalTitle(data);
    return;
  }

  if (type === "loading") {
    openModalLoading(data.text);
    return;
  }

  if (type === "error") {
    openModalError(data.error);
    return;
  }

  if (type === "actions") {
    openModalActions(data);
    return;
  }

  if (type === "action") {
    if (data.type === 'copyToTheClipboard') {
      const { text, infoText } = data.data;
      navigator.clipboard.writeText(text);
      openModalText(infoText);
    }
    return;
  }

  openModalText(data.text, data.chatHistory, data.keepActions);
});

document.addEventListener("closeModal", () => {
  chrome.runtime.sendMessage({ message: "stopRequest" });
});

// Seleccionar todos los elementos <a> con la clase "miEnlace"
const enlaces = document.querySelectorAll("a");
enlaces.forEach(function (enlace) {
  enlace.addEventListener("click", (event) => {
    // Verificar si la tecla Shift está presionada
    if (event.shiftKey) {
      // Evitar el comportamiento predeterminado del enlace
      event.preventDefault();
      chrome.runtime.sendMessage({ message: "link", linkUrl: enlace.href });
    }
  });
});

</script>