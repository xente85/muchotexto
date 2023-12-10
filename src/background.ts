import { AI } from "./utils/ai";
import { prompts } from "./utils/prompt";

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    // title: chrome.i18n.getMessage("menuLink"),
    title: chrome.i18n.getMessage("menuLink"),
    contexts: ["link"],
    id: "link",
  });
  chrome.contextMenus.create({
    title: chrome.i18n.getMessage("menuSelection"),
    contexts: ["selection"],
    id: "selection",
  });
  chrome.contextMenus.create({
    title: chrome.i18n.getMessage("menuSelectionTraslate"),
    contexts: ["selection"],
    id: "selectionTranslate",
  });
});

chrome.contextMenus.onClicked.addListener((event) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0 && tabs[0].id) {
      const tabId = tabs[0].id;
      sendTabMessage(tabId, "loading");
      try {
        const prompt = await prompts.getPrompt(event);
        const response = await AI.requestInfo(prompt);
        processStreamResponse(response as ReadableStream<Uint8Array>, tabId);
      } catch (e) {
        sendTabMessageError(tabId, { error: e });
      }
    }
  });
});

async function processStreamResponse(
  response: ReadableStream<Uint8Array>,
  tabId: number
) {
  const resRead = response.getReader();
  while (true) {
    const { done, value } = await resRead.read();
    if (done) break;
    if (done === undefined || value === undefined) {
      sendTabMessageError(tabId, { error: "ERROR" });
    }
    const answer = new TextDecoder().decode(value);
    try {
      const res = await answer.split("data:");
      try {
        const detail = JSON.parse(res[0]).detail;
        sendTabMessage(tabId, "text", { text: detail });
      } catch (e) {
        try {
          const resTrim = res[1].trim();
          if (resTrim === "[DONE]") return;
          const answerJson = JSON.parse(resTrim);
          let final = answerJson.message.content.parts[0];
          final = final.replace(/\n/g, "<br>");
          sendTabMessage(tabId, "text", { text: final });
        } catch (e) {
          // no se hacer nada
        }
      }
    } catch (e: any) {
      sendTabMessageError(tabId, {
        error: chrome.i18n.getMessage("errorTemporal", [e]),
      });
    }
  }
}

function sendTabMessage(tabId: number, type: string, data: any = {}) {
  chrome.tabs.sendMessage(tabId, { type, data });
}

function sendTabMessageError(tabId: number, data: any) {
  sendTabMessage(tabId, "error", data);
}
