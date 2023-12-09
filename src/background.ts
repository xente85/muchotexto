import { getArticle } from "./utils/utils";
import { AI } from "./utils/ai";

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    title: "Resume artículo",
    contexts: ["link"],
    id: "link",
  });
  chrome.contextMenus.create({
    title: "Resume texto",
    contexts: ["selection"],
    id: "selection",
  });
});

chrome.contextMenus.onClicked.addListener((event) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0 && tabs[0].id) {
      const { menuItemId } = event;
      chrome.tabs.sendMessage(tabs[0].id, { type: "loading" });

      let data = null;
      if (menuItemId === "selection") {
        data = event.selectionText;
      } else if (menuItemId === "link" && event.linkUrl) {
        data = await getArticle(event.linkUrl);
      } else {
        data = event;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: menuItemId, data });
    }
  });
});

// TODO: mejorar
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    const prompt = msg.prompt;
    AI.getResponse(prompt)
      .then(async (answer) => {
        const resRead = (answer as ReadableStream<Uint8Array>).getReader();
        while (true) {
          const { done, value } = await resRead.read();
          if (done) break;
          if (done === undefined || value === undefined)
            port.postMessage("ERROR");
          const data = new TextDecoder().decode(value);
          port.postMessage(data);
        }
      })
      .catch((e) => port.postMessage(e));
  });
});
