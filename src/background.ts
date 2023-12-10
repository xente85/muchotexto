import { AI } from "./utils/ai";
import { prompts } from "./utils/prompt";

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
      chrome.tabs.sendMessage(tabs[0].id, { type: "loading" });
      try {
        const prompt = await prompts.getPrompt(event);
        const response = await AI.requestInfo(prompt);

        const resRead = (response as ReadableStream<Uint8Array>).getReader();
        while (true) {
          const { done, value } = await resRead.read();
          if (done) break;
          if (done === undefined || value === undefined) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "error",
              data: { error: "ERROR" },
            });
          }
          const answer = new TextDecoder().decode(value);
          try {
            const res = await answer.split("data:");
            try {
              const detail = JSON.parse(res[0]).detail;
              chrome.tabs.sendMessage(tabs[0].id, {
                type: "text",
                data: { text: detail },
              });
            } catch (e) {
              try {
                const resTrim = res[1].trim();
                if (resTrim === "[DONE]") return;
                const answerJson = JSON.parse(resTrim);
                let final = answerJson.message.content.parts[0];
                final = final.replace(/\n/g, "<br>");
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: "text",
                  data: { text: final },
                });
              } catch (e) {
                // no se hacer nada
              }
            }
          } catch (e) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "error",
              data: {
                error: `Something went wrong. Please try in a few minutes. ${e}`,
              },
            });
          }
        }
      } catch (e) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "error",
          data: { error: e },
        });
      }
    }
  });
});
