export class prompts {
  static getPrompt(type: string, data: string | any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        switch (type) {
          case "article": {
            resolve(prompts.promptArticle(data));
            break;
          }
          case "summarize": {
            resolve(prompts.promptSummarize(data));
            break;
          }
          case "translate": {
            resolve(prompts.promptTranslate(data));
            break;
          }
          default: {
            reject(chrome.i18n.getMessage("errorPromptUnkown", [type]));
            break;
          }
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  static promptArticle(data: any) {
    const jsonArticle = {
      titular: data.title,
      noticia: data.description,
    };
    return chrome.i18n.getMessage("promptArticle", [
      JSON.stringify(jsonArticle),
    ]);
  }

  static promptSummarize(textoSeleccionado: string) {
    return chrome.i18n.getMessage("promptSummarize", [textoSeleccionado]);
  }

  static promptTranslate(textoSeleccionado: string) {
    return chrome.i18n.getMessage("promptTranslate", [textoSeleccionado]);
  }
}
