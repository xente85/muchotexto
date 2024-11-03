<template>
  <Modal 
    :opened="opened"
    :iconUrl="iconUrl"
    :title="title"
    :subtitle="subtitle"
    :loading="loading"
    :loadingText="loadingText"
    :text="textInfo"
    :isError="isError"
    @closeModal="closeModal"
    @submit="sendDataToApi"
  />
</template>

<script setup lang="ts">
import Modal from './Modal.vue';
import { ref } from 'vue';

// Variables estaticas
const iconUrl = chrome.runtime.getURL("assets/icons/icon.png");

// Variables reactivas
const opened = ref(false);
const title = ref('');
const subtitle = ref('');
const loading = ref(false);
const loadingText = ref('');
const textInfo = ref('');
const isError = ref(false);
const idChat = ref('');

const openModal = () => {
  opened.value = true;
};

const closeModal = () => {
  opened.value = false;
  chrome.runtime.sendMessage({ action: 'modalClosed' });
};

const showLoading = (text: string) => {
  openModal();
  loading.value = true;
  loadingText.value = text;
}

const closeLoading = () => {
  loading.value = false;
  loadingText.value = '';
};

const showError = (error: string) => {
  isError.value = true;
  showInfo(error);
}

const showResult = (text: string) => {
  isError.value = false;
  showInfo(text);
}

const showInfo = (text: string) => {
  openModal();
  closeLoading();
  textInfo.value = text;
};

const sendDataToApi = (inputValue: string) => {
  chrome.runtime.sendMessage({ action: 'reply', idChat: idChat.value, prompt: inputValue });
};

chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;

  if (type === 'title') {
    title.value = data.title;
    subtitle.value = data.subtitle;
    return;
  }

  if (type === 'loading') {
    showLoading(data.text);
    return;
  }

  if (type === 'error') {
    showError(data.error);
    return;
  }

  if (type === 'actions') {
    idChat.value = data.data.idChat;
    return;
  }

  showResult(data.text);
});
</script>