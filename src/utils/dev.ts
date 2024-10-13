const devOn = process.env.NODE_ENV === "development";

function devMenu() {
  if (!devOn) return;

  chrome.contextMenus.create({
    title: "Test Loading",
    id: "testLoading",
  });
  chrome.contextMenus.create({
    title: "Test Resultado Seleccion",
    id: "testResultadoSeleccion",
  });
  chrome.contextMenus.create({
    title: "Test Resultado articulo",
    id: "testResultadoArticulo",
  });
  chrome.contextMenus.create({
    title: "Test Error",
    id: "testError",
  });
}

function devOnClick(
  tabId: number,
  event: chrome.contextMenus.OnClickData,
  sendTabMessageTitle: any,
  sendTabMessageText: any,
  sendTabMessageLoading: any,
  sendTabMessageActions: any,
  sendTabMessageError: any
) {
  const menuId = event.menuItemId.toString();
  if (
    [
      "testResultadoSeleccion",
      "testLoading",
      "testResultadoArticulo",
      "testError",
    ].includes(menuId)
  ) {
    if (menuId === "testResultadoSeleccion") {
      sendTabMessageTitle(tabId, {
        title: menuId,
        subtitle: "Subtitulo",
        isSelection: true,
      });

      sendTabMessageText(tabId, {
        text: "Lorem Ipsum es simplemente el texto de relleno de las imprentas y archivos de texto.",
        chatHistory: [
          { role: 'user', content: 'Ejemplo prompt' },
          { role: 'assistant', content: 'Respuesta prompt' }
        ],
      });

      sendTabMessageActions(tabId, {
        type: "selection",
        data: { selection: true, idChat: "xxxx" },
      });
    } else if (menuId === "testLoading") {
      sendTabMessageTitle(tabId, {
        title: menuId,
        subtitle: "Subtitulo",
        isLink: true,
      });

      sendTabMessageLoading(tabId, chrome.i18n.getMessage("uiLoadingArticle"));
    } else if (menuId === "testResultadoArticulo") {
      sendTabMessageTitle(tabId, {
        title: menuId,
        subtitle: "Subtitulo",
      });

      sendTabMessageText(tabId, {
        text: "Lorem Ipsum es simplemente el texto de relleno de las imprentas y archivos de texto.",
      });

      sendTabMessageActions(tabId, {
        type: "article",
        data: { article: true, idChat: "xxxx" },
      });
    } else if (menuId === "testError") {
      sendTabMessageTitle(tabId, {
        title: menuId,
        subtitle: "Subtitulo",
      });
      sendTabMessageError(tabId, {
        error: "Error test",
      });
    }
    return true;
  }

  return false;
}

export { devMenu, devOnClick };
