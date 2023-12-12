import { AI } from "./utils/ai";
import { devMenu, devOnClick } from "./utils/dev";
import { prompts } from "./utils/prompt";
import { getArticle } from "./utils/utils";

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

  devMenu();
});

chrome.contextMenus.onClicked.addListener((event) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0 && tabs[0].id) {
      const tabId = tabs[0].id;
      onTabClick(tabId, event);
    }
  });
});

async function onTabClick(
  tabId: number,
  event: chrome.contextMenus.OnClickData
) {
  if (
    devOnClick(
      tabId,
      event,
      sendTabMessageTitle,
      sendTabMessageText,
      sendTabMessageLoading,
      sendTabMessageActions
    )
  )
    return;
  try {
    const { type, data } = await getDataPrompt(tabId, event);
    const prompt = await prompts.getPrompt(type, data);
    const response = await AI.requestInfo(prompt);
    processStreamResponse(response as ReadableStream<Uint8Array>, tabId);
    sendTabMessageActions(tabId, { type, data });
  } catch (e) {
    sendTabMessageError(tabId, {
      error: e instanceof Error ? e.message : "Error desconocido",
    });
  }
}

async function getDataPrompt(
  tabId: number,
  event: chrome.contextMenus.OnClickData
) {
  const { menuItemId } = event;

  switch (menuItemId) {
    case "link": {
      if (!event.linkUrl)
        throw new Error(chrome.i18n.getMessage("errorPromptArticle"));

      sendTabMessageTitle(tabId, {
        title: event.linkUrl,
        subtitle: chrome.i18n.getMessage("menuLink"),
        isLink: true,
      });

      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingArticle"));

      const article = await getArticle(event.linkUrl);

      if (article === null || article.error) {
        throw new Error(chrome.i18n.getMessage("errorArticulo"));
      }

      sendTabMessageTitle(tabId, {
        title: article.title,
        subtitle: chrome.i18n.getMessage("menuLink"),
      });

      sendTabMessageLoading(
        tabId,
        chrome.i18n.getMessage("uiLoadingArticleSummary")
      );

      return { type: "article", data: article };
    }
    case "selection": {
      if (!event.selectionText)
        throw new Error(chrome.i18n.getMessage("errorPromptSelection"));

      sendTabMessageTitle(tabId, {
        title: event.selectionText,
        subtitle: chrome.i18n.getMessage("menuSelection"),
        isSelection: true,
      });

      sendTabMessageLoading(
        tabId,
        chrome.i18n.getMessage("uiLoadingSelectionSummary")
      );

      return { type: "summarize", data: event.selectionText };
    }
    case "selectionTranslate": {
      if (!event.selectionText)
        throw new Error(chrome.i18n.getMessage("errorPromptSelection"));

      sendTabMessageTitle(tabId, {
        title: event.selectionText,
        subtitle: chrome.i18n.getMessage("menuSelectionTraslate"),
        isSelection: true,
      });

      sendTabMessageLoading(
        tabId,
        chrome.i18n.getMessage("uiLoadingSelectionTraslate")
      );

      return { type: "translate", data: event.selectionText };
    }
    default: {
      throw new Error(chrome.i18n.getMessage("errorPromptUnkown"));
    }
  }
}

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
        sendTabMessageText(tabId, { text: detail });
      } catch (e) {
        try {
          const resTrim = res[1].trim();
          if (resTrim === "[DONE]") return;
          const answerJson = JSON.parse(resTrim);
          let final = answerJson.message.content.parts[0];
          final = final.replace(/\n/g, "<br>");
          sendTabMessageText(tabId, { text: final });
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
function sendTabMessageLoading(
  tabId: number,
  text: string = chrome.i18n.getMessage("uiLoading")
) {
  sendTabMessage(tabId, "loading", { text });
}

function sendTabMessageTitle(tabId: number, data: any) {
  sendTabMessage(tabId, "title", data);
}

function sendTabMessageText(tabId: number, data: any) {
  sendTabMessage(tabId, "text", data);
}

function sendTabMessageError(tabId: number, data: any) {
  sendTabMessage(tabId, "error", data);
}

function sendTabMessageActions(tabId: number, data: any) {
  sendTabMessage(tabId, "actions", data);
}
