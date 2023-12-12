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
        text: 'Lorem Ipsum es simplemente el texto de relleno de las imprentas y archivos de texto. Lorem Ipsum ha sido el texto de relleno estándar de las industrias desde el año 1500, cuando un impresor (N. del T. persona que se dedica a la imprenta) desconocido usó una galería de textos y los mezcló de tal manera que logró hacer un libro de textos especimen. No sólo sobrevivió 500 años, sino que tambien ingresó como texto de relleno en documentos electrónicos, quedando esencialmente igual al original. Fue popularizado en los 60s con la creación de las hojas "Letraset", las cuales contenian pasajes de Lorem Ipsum, y más recientemente con software de autoedición, como por ejemplo Aldus PageMaker, el cual incluye versiones de Lorem Ipsum.',
      });

      sendTabMessageActions(tabId, {
        type: "selection",
        data: { selection: true },
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
        text: 'Lorem Ipsum es simplemente el texto de relleno de las imprentas y archivos de texto. Lorem Ipsum ha sido el texto de relleno estándar de las industrias desde el año 1500, cuando un impresor (N. del T. persona que se dedica a la imprenta) desconocido usó una galería de textos y los mezcló de tal manera que logró hacer un libro de textos especimen. No sólo sobrevivió 500 años, sino que tambien ingresó como texto de relleno en documentos electrónicos, quedando esencialmente igual al original. Fue popularizado en los 60s con la creación de las hojas "Letraset", las cuales contenian pasajes de Lorem Ipsum, y más recientemente con software de autoedición, como por ejemplo Aldus PageMaker, el cual incluye versiones de Lorem Ipsum.',
      });

      sendTabMessageActions(tabId, {
        type: "article",
        data: { article: true },
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
