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
              reject(`Tipo "link" sin event.linkUrl`);
            }
            break;
          }
          case "selection": {
            if (event.selectionText) {
              resolve(prompts.promptSelection(event.selectionText));
            } else {
              reject(`Tipo "selection" sin event.selectionText`);
            }
            break;
          }
          case "selectionTranslate": {
            if (event.selectionText) {
              resolve(prompts.promptSelectionTranslate(event.selectionText));
            } else {
              reject(`Tipo "selectionTranslate" sin event.selectionText`);
            }
            break;
          }
          default: {
            reject(`Tipo ${menuItemId} desconocido`);
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

    const prompt = `
      Quiero que me hagas un resumen de no mas de 200 palabras de esta noticia. Pon el foco a lo que se refiere el titular: "${JSON.stringify(
        jsonArticle
      )}"
    `;

    /*
    const prompt = `
      Quiero que me hagas un resumen de puntos clave en forma de lista. Pon el foco a lo que se refiere el titular: "${JSON.stringify(
        jsonArticle
      )}"
    `;
    */

    return prompt;
  }

  static promptSelection(textoSeleccionado: string) {
    return `Resúme este texto a no mas de 200 palabras "${textoSeleccionado}"`;
  }

  static promptSelectionTranslate(textoSeleccionado: string) {
    // return `Traduce este texto y explicame brevemente cosas a tener en cuenta para un B1: "${textoSeleccionado}"`;
    return `Traduce este texto: "${textoSeleccionado}"`;
  }
}
