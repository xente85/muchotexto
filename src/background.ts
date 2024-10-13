import { ConexionController } from "./utils/conexionController";
import { devMenu, devOnClick } from "./utils/dev";
import { prompts } from "./utils/prompt";
import { getArticle, getResponseIA, getResponseIATab } from "./utils/utils";

const idChat = "66eff5a5-9c50-800e-a2a8-93d5d54ac170";

const conexionController = new ConexionController();

chrome.runtime.onInstalled.addListener(() => {
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
  chrome.contextMenus.create({
    title: chrome.i18n.getMessage("menuPage"),
    id: "summarizePage",
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
      sendTabMessageActions,
      sendTabMessageError
    )
  )
    return;
  try {
    const { type, data } = await getDataPrompt(
      tabId,
      event,
      conexionController.getController()
    );
    const prompt = await prompts.getPrompt(type, data);
    /*
    const response = await getResponseIATab(
      tabId,
      idChat,
      prompt,
      conexionController.getController()
    );
    */
    const response = await getResponseIA(
      prompt,
      conexionController.getController()
    );
    sendTabMessageActions(tabId, { type, data });
    sendTabMessageText(tabId, { text: response.response });
  } catch (e: any) {
    if (e instanceof Error && e.message.toUpperCase().includes("ABORTED"))
      return;
    sendTabMessageError(tabId, {
      error: e instanceof Error ? e.message : e.toString(),
    });
  }
}

async function getDataPrompt(
  tabId: number,
  event: chrome.contextMenus.OnClickData,
  controller: AbortController
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

      const article = await getArticle(event.linkUrl, controller);

      if (article === null || article.error) {
        throw new Error(
          article.error || chrome.i18n.getMessage("errorArticulo")
        );
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
    case "summarizePage": {
      if (!event.pageUrl)
        throw new Error(chrome.i18n.getMessage("errorPromptPage"));

      sendTabMessageTitle(tabId, {
        title: event.pageUrl,
        subtitle: chrome.i18n.getMessage("menuPage"),
        isLink: true,
      });

      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingPage"));

      const page = await getArticle(event.pageUrl, controller);

      if (page === null || page.error) {
        throw new Error(chrome.i18n.getMessage("errorPage"));
      }

      sendTabMessageTitle(tabId, {
        title: page.title,
        subtitle: chrome.i18n.getMessage("menuPage"),
      });

      sendTabMessageLoading(
        tabId,
        chrome.i18n.getMessage("uiLoadingPageSummary")
      );

      return { type: "page", data: page };
    }
    default: {
      throw new Error(chrome.i18n.getMessage("errorPromptUnkown"));
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

function sendTabMessageAction(tabId: number, data: any) {
  sendTabMessage(tabId, "action", data);
}
