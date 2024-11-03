<template>
  <Modal
    :opened="opened"
    :iconUrl="iconUrl"
    :title="title"
    :subtitle="subtitle"
    :loading="loading"
    :loadingText="loadingText"
    :info="modalInfo"
    :isError="isError"
    @closeModal="closeModal"
    @submit="sendDataToApi"
  />
</template>

<script setup lang="ts">
import Modal from './Modal.vue';
import { ref } from 'vue';

// Interface
import { Info } from './interfaces'

// Variables estaticas
const iconUrl = chrome.runtime.getURL("assets/icons/icon.png");

// Variables reactivas
const opened = ref(false);
const title = ref('');
const subtitle = ref('');
const loading = ref(false);
const loadingText = ref('');
const modalInfo = ref<Array<Info>>([]);
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
  showInfo([{ info: 'error', date: '', text: error }]);
}

const showResult = (data: any) => {
  isError.value = false;

  let result = [{ info: 'assistant', date: '', text: data.text }];
  if (data.chatHistory && data.chatHistory.length > 1) {
    const chatHistory = data.chatHistory.slice(1);
    const chat = chatHistory.map((c: any) => ({ info: c.role, date: '', text: c.content }));
    result = [...chat, ...result];
  }

  showInfo(result);
}

const showInfo = (info: Array<Info>) => {
  openModal();
  closeLoading();
  modalInfo.value = info;
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

  showResult(data);
});
</script>