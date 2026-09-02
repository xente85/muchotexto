import { ConexionController } from "./utils/conexionController";
import { devMenu, devOnClick } from "./utils/dev";
import { prompts } from "./utils/prompt";
import { getArticle, getResponseIA, getFactCheck, getResponseIATab, getNewIdChat } from "./utils/utils";

const idChat = "66eff5a5-9c50-800e-a2a8-93d5d54ac170";
const ARTICLE_PROTECTED_CODE = "ARTICLE_PROTECTED";

function factCheckLog(event: string, details: any = {}) {
  console.log(`[MuchoTexto][fact-check] ${event}`, details);
}

function getUrlDomain(url?: string) {
  try {
    return url ? new URL(url).hostname : "unknown";
  } catch {
    return "invalid";
  }
}

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
  chrome.contextMenus.create({
    title: chrome.i18n.getMessage("menuVerifyLink"),
    contexts: ["link"],
    id: "verifyLink",
  });
  chrome.contextMenus.create({
    title: chrome.i18n.getMessage("menuVerifyPage"),
    contexts: ["page"],
    id: "verifyPage",
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

chrome.runtime.onMessage.addListener(async (request, sender) => {
  if (!sender.tab || !sender.tab.id) return;

  const { action, idChat, prompt, sourceUrl } = request;

  const tabId = sender.tab.id;
  if (action === 'reply') {
    try {
      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingReply"));
      const { chatHistory } = await getResponseIA(
        idChat,
        prompt,
        conexionController.getController()
      );
      sendTabMessageText(tabId, { text: chatHistory.pop().content, chatHistory, keepActions: true });
    } catch (e: any) {
      if (e instanceof Error && e.message.toUpperCase().includes("ABORTED"))
        return;
      sendTabMessageError(tabId, {
        error: e instanceof Error ? e.message : e.toString(),
      });
    }
  } else if (action === 'factCheck') {
    if (!sourceUrl) {
      sendTabMessageError(tabId, { error: chrome.i18n.getMessage("errorPromptArticle") });
      return;
    }
    conexionController.abort();
    onTabClick(tabId, {
      menuItemId: "verifyLink",
      linkUrl: sourceUrl,
    } as chrome.contextMenus.OnClickData);
  } else if (action === 'modalClosed') {
    conexionController.abort();
  } else if (action === 'link') {
    conexionController.abort();
    console.log('onMessage - link', request);
  }
});

async function onTabClick(
  tabId: number,
  event: chrome.contextMenus.OnClickData
) {
  const isFactCheck = ["verifyLink", "verifyPage"].includes(event.menuItemId.toString());
  if (isFactCheck) {
    factCheckLog("action.clicked", {
      action: event.menuItemId.toString(),
      sourceDomain: getUrlDomain(event.linkUrl || event.pageUrl),
    });
  }
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
    /*
    const response = await getResponseIATab(
      tabId,
      idChat,
      prompt,
      conexionController.getController()
    );
    */
    const idChat = getNewIdChat();
    const controller = conexionController.getController();
    const { chatHistory } = ["factCheckArticle", "factCheckPage"].includes(type)
      ? await getFactCheck(idChat, data, controller)
      : await getResponseIA(idChat, await prompts.getPrompt(type, data), controller);
    sendTabMessageActions(tabId, {
      type,
      data: {
        idChat,
        sourceUrl: ["article", "page", "factCheckArticle", "factCheckPage"].includes(type)
          ? data.sourceUrl
          : undefined,
      },
    });
    sendTabMessageText(tabId, { text: chatHistory.pop().content, chatHistory, keepActions: true });
  } catch (e: any) {
    if (e instanceof Error && e.message.toUpperCase().includes("ABORTED"))
      return;
    if (isFactCheck) {
      console.error("[MuchoTexto][fact-check] action.failed", {
        action: event.menuItemId.toString(),
        message: e instanceof Error ? e.message : String(e),
      });
    }
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

      let article = await getArticle(event.linkUrl, controller);

      if (article?.code === ARTICLE_PROTECTED_CODE) {
        sendTabMessageLoading(tabId, "Abriendo la noticia en segundo plano para extraer el texto...");
        article = await getArticleFromBackgroundTab(event.linkUrl);
      }

      if (!article || article.error) {
        throw new Error(
          article?.error || chrome.i18n.getMessage("errorArticulo")
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

      return {
        type: "article",
        data: { ...article, sourceUrl: event.linkUrl },
      };
    }
    case "verifyLink": {
      if (!event.linkUrl)
        throw new Error(chrome.i18n.getMessage("errorPromptArticle"));

      sendTabMessageTitle(tabId, {
        title: event.linkUrl,
        subtitle: chrome.i18n.getMessage("menuVerifyLink"),
        isLink: true,
      });
      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingArticle"));
      factCheckLog("article.extraction.started", {
        mode: "link",
        sourceDomain: getUrlDomain(event.linkUrl),
      });

      let article = await getArticle(event.linkUrl, controller);
      if (article?.code === ARTICLE_PROTECTED_CODE) {
        factCheckLog("article.extraction.fallback", { reason: ARTICLE_PROTECTED_CODE });
        sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingProtectedArticle"));
        article = await getArticleFromBackgroundTab(event.linkUrl);
      }
      factCheckLog("article.extraction.completed", {
        articleChars: article.content?.length || article.textContent?.length || 0,
      });
      if (!article || article.error) {
        throw new Error(article?.error || chrome.i18n.getMessage("errorArticulo"));
      }

      sendTabMessageTitle(tabId, {
        title: article.title,
        subtitle: chrome.i18n.getMessage("menuVerifyLink"),
      });
      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingFactCheck"));
      return {
        type: "factCheckArticle",
        data: { ...article, sourceUrl: event.linkUrl },
      };
    }
    case "selection": {
      if (!event.selectionText)
        throw new Error(chrome.i18n.getMessage("errorPromptSelection"));

      sendTabMessageTitle(tabId, {
        title: chrome.i18n.getMessage("menuSelection"),
        subtitle: "",
        originalText: event.selectionText,
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
        title: chrome.i18n.getMessage("menuSelectionTraslate"),
        subtitle: "",
        originalText: event.selectionText,
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

      let page = await getArticle(event.pageUrl, controller);

      if (page?.code === ARTICLE_PROTECTED_CODE) {
        sendTabMessageLoading(tabId, "Extrayendo el texto desde la pestaña actual...");
        page = await getArticleFromTab(tabId);
      }

      if (!page || page.error) {
        throw new Error(page?.error || chrome.i18n.getMessage("errorPage"));
      }

      sendTabMessageTitle(tabId, {
        title: page.title,
        subtitle: chrome.i18n.getMessage("menuPage"),
      });

      sendTabMessageLoading(
        tabId,
        chrome.i18n.getMessage("uiLoadingPageSummary")
      );

      return {
        type: "page",
        data: { ...page, sourceUrl: event.pageUrl },
      };
    }
    case "verifyPage": {
      if (!event.pageUrl)
        throw new Error(chrome.i18n.getMessage("errorPromptPage"));

      sendTabMessageTitle(tabId, {
        title: event.pageUrl,
        subtitle: chrome.i18n.getMessage("menuVerifyPage"),
        isLink: true,
      });
      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingPage"));
      factCheckLog("article.extraction.started", {
        mode: "page",
        sourceDomain: getUrlDomain(event.pageUrl),
      });

      let page = await getArticle(event.pageUrl, controller);
      if (page?.code === ARTICLE_PROTECTED_CODE) {
        factCheckLog("article.extraction.fallback", { reason: ARTICLE_PROTECTED_CODE });
        sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingCurrentTab"));
        page = await getArticleFromTab(tabId);
      }
      factCheckLog("article.extraction.completed", {
        articleChars: page.content?.length || page.textContent?.length || 0,
      });
      if (!page || page.error) {
        throw new Error(page?.error || chrome.i18n.getMessage("errorPage"));
      }

      sendTabMessageTitle(tabId, {
        title: page.title,
        subtitle: chrome.i18n.getMessage("menuVerifyPage"),
      });
      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingFactCheck"));
      return {
        type: "factCheckPage",
        data: { ...page, sourceUrl: event.pageUrl },
      };
    }
    default: {
      throw new Error(chrome.i18n.getMessage("errorPromptUnkown"));
    }
  }
}

function waitForTabLoaded(tabId: number) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Tiempo de espera agotado cargando la noticia."));
    }, 15000);

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

function createBackgroundTab(url: string) {
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(tab);
    });
  });
}

async function removeTab(tabId: number) {
  return new Promise<void>((resolve) => {
    chrome.tabs.remove(tabId, () => resolve());
  });
}

async function getArticleFromBackgroundTab(url: string) {
  const tab = await createBackgroundTab(url);

  if (!tab.id) {
    throw new Error("No se pudo abrir la noticia en segundo plano.");
  }

  try {
    await waitForTabLoaded(tab.id);
    return await getArticleFromTab(tab.id);
  } finally {
    await removeTab(tab.id);
  }
}

async function getArticleFromTab(tabId: number) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractArticleFromPage,
  });

  const article = result?.result;

  if (!article?.content) {
    throw new Error("No se pudo extraer texto de la noticia desde el navegador.");
  }

  return article;
}

function extractArticleFromPage() {
  function normalizeText(text = "") {
    return text.replace(/\s+/g, " ").trim();
  }

  function getMetaContent(selector: string) {
    return document.querySelector<HTMLMetaElement>(selector)?.content || "";
  }

  function getStructuredArticleBody() {
    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));

    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "");
        const items = Array.isArray(data) ? data : [data, ...(data["@graph"] || [])];
        const article = items.find((item) => {
          const type = item?.["@type"];
          const types = Array.isArray(type) ? type : [type];
          return types.some((value) => ["Article", "NewsArticle", "ReportageNewsArticle"].includes(value));
        });

        if (article?.articleBody) return article.articleBody;
      } catch {
        continue;
      }
    }

    return "";
  }

  const title = normalizeText(
    getMetaContent('meta[property="og:title"]') ||
    document.querySelector("h1")?.textContent ||
    document.title
  );
  const description = normalizeText(
    getMetaContent('meta[name="description"]') ||
    getMetaContent('meta[property="og:description"]')
  );
  const structuredBody = normalizeText(getStructuredArticleBody());
  const visibleBody = normalizeText(
    document.querySelector("article")?.textContent ||
    document.querySelector("main")?.textContent ||
    document.body?.innerText ||
    ""
  );
  const content = [description, structuredBody || visibleBody].filter(Boolean).join("\n\n");

  return {
    title,
    content,
    textContent: content,
    byline: "",
    siteName: getMetaContent('meta[property="og:site_name"]'),
    excerpt: description,
    length: content.length,
    url: location.href,
  };
}

function sendTabMessage(tabId: number, type: string, data: any = {}) {
  chrome.tabs.sendMessage(tabId, { type, data }, () => {
    const error = chrome.runtime.lastError;
    if (error) {
      console.error('[MuchoTexto][message] delivery.failed', {
        tabId,
        type,
        message: error.message,
      });
      return;
    }
    if (["text", "error"].includes(type)) {
      console.log('[MuchoTexto][message] delivery.completed', {
        tabId,
        type,
        textChars: data?.text?.length || data?.error?.length || 0,
      });
    }
  });
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
