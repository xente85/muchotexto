import { getArticle } from "./utils";

export class prompts {
  static getPrompt(event: chrome.contextMenus.OnClickData): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const { menuItemId } = event;
      try {
        switch (menuItemId) {
          case "link": {
            if (event.linkUrl) {
              const article = await getArticle(event.linkUrl);
              resolve(prompts.promptLink(article));
            } else {
              reject(chrome.i18n.getMessage("errorPromptLink", [menuItemId]));
            }
            break;
          }
          case "selection": {
            if (event.selectionText) {
              resolve(prompts.promptSelection(event.selectionText));
            } else {
              reject(
                chrome.i18n.getMessage("errorPromptSelection", [menuItemId])
              );
            }
            break;
          }
          case "selectionTranslate": {
            if (event.selectionText) {
              resolve(prompts.promptSelectionTranslate(event.selectionText));
            } else {
              reject(
                chrome.i18n.getMessage("errorPromptSelection", [menuItemId])
              );
            }
            break;
          }
          default: {
            reject(
              chrome.i18n.getMessage("errorPromptUnkown", [
                menuItemId.toString(),
              ])
            );
            break;
          }
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  static promptLink(data: any) {
    const jsonArticle = {
      titular: data.title,
      noticia: data.description,
    };
    return chrome.i18n.getMessage("promptLink", [JSON.stringify(jsonArticle)]);
  }

  static promptSelection(textoSeleccionado: string) {
    return chrome.i18n.getMessage("promptSelection", [textoSeleccionado]);
  }

  static promptSelectionTranslate(textoSeleccionado: string) {
    return chrome.i18n.getMessage("promptTranslate", [textoSeleccionado]);
  }
}
