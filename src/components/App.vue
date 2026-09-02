<template>
  <Modal
    :opened="opened"
    :iconUrl="iconUrl"
    :title="title"
    :subtitle="subtitle"
    :originalText="originalText"
    :sourceUrl="sourceUrl"
    :canFactCheck="canFactCheck"
    :loading="loading"
    :loadingText="loadingText"
    :info="modalInfo"
    :isError="isError"
    @closeModal="closeModal"
    @submit="sendDataToApi"
    @factCheck="startFactCheck"
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
const originalText = ref('');
const sourceUrl = ref('');
const canFactCheck = ref(false);
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

const startFactCheck = () => {
  if (!sourceUrl.value) return;
  canFactCheck.value = false;
  chrome.runtime.sendMessage({ action: 'factCheck', sourceUrl: sourceUrl.value });
};

chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;
  console.log('[MuchoTexto][modal] message.received', {
    type,
    textChars: data?.text?.length || data?.error?.length || 0,
  });

  if (type === 'title') {
    title.value = data.title;
    subtitle.value = data.subtitle;
    originalText.value = data.originalText || '';
    sourceUrl.value = '';
    canFactCheck.value = false;
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
    sourceUrl.value = data.data.sourceUrl || '';
    canFactCheck.value = ["article", "page"].includes(data.type);
    return;
  }

  showResult(data);
});
</script>
