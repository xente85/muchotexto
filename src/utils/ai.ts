import { sleep } from "./utils";

export class AI {
  static getPromptByType(type: string, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      switch (type) {
        case "link": {
          if (data.error) {
            reject(data.error);
            break;
          }
          resolve(AI.promptLink(data));
          break;
        }
        case "selection": {
          resolve(AI.promptSelection(data));
          break;
        }
        default: {
          reject("Tipo desconocido");
          break;
        }
      }
    });
  }

  static processResponse(answer: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        switch (answer) {
          case "ERROR": {
            reject(
              'You need to once visit <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a> and check if the connection is secure. Redirecting...'
            );
            await sleep(3000);
            chrome.tabs.create({ url: "https://chat.openai.com/chat" });
            break;
          }
          case "CLOUDFLARE": {
            reject(
              'Something went wrong. Are you logged in to <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a>? Try logging out and logging in again.'
            );
            break;
          }
          default: {
            try {
              const res = await answer.split("data:");
              try {
                const detail = JSON.parse(res[0]).detail;
                resolve(detail);
              } catch (e) {
                try {
                  const resTrim = res[1].trim();
                  if (resTrim === "[DONE]") return;
                  const answerJson = JSON.parse(resTrim);
                  let final = answerJson.message.content.parts[0];
                  final = final.replace(/\n/g, "<br>");
                  resolve(final);
                } catch (e) {
                  // reject(`Error: ${e}`);
                }
              }
            } catch (e) {
              reject(
                `Something went wrong. Please try in a few minutes. (${e})`
              );
            }
            break;
          }
        }
      } catch (error) {
        reject(`Something went wrong. Please try in a few minutes. (${error})`);
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

    return prompt;
  }

  static promptSelection(textoSeleccionado: string) {
    return `Resúme este texto a no mas de 200 palabras "${textoSeleccionado}"`;
  }

  static uid() {
    const generateNumber = (limit: number) => {
      const value = limit * Math.random();
      return value | 0;
    };
    const generateX = () => {
      const value = generateNumber(16);
      return value.toString(16);
    };
    const generateXes = (count: number) => {
      let result = "";
      for (let i = 0; i < count; ++i) {
        result += generateX();
      }
      return result;
    };
    const generateconstant = () => {
      const value = generateNumber(16);
      const constant = (value & 0x3) | 0x8;
      return constant.toString(16);
    };

    const generate = () => {
      const result =
        generateXes(8) +
        "-" +
        generateXes(4) +
        "-" +
        "4" +
        generateXes(3) +
        "-" +
        generateconstant() +
        generateXes(3) +
        "-" +
        generateXes(12);
      return result;
    };
    return generate();
  }

  static getToken() {
    return new Promise(async (resolve, reject) => {
      const resp = await fetch("https://chat.openai.com/api/auth/session");
      if (resp.status === 403) {
        reject("CLOUDFLARE");
      }
      try {
        const data = await resp.json();
        if (!data.accessToken) {
          reject("ERROR");
        }
        resolve(data.accessToken);
      } catch (err) {
        reject("ERROR");
      }
    });
  }

  static getResponse(question: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const accessToken = await AI.getToken();
        const res = await fetch(
          "https://chat.openai.com/backend-api/conversation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + accessToken,
            },
            body: JSON.stringify({
              action: "next",
              messages: [
                {
                  id: AI.uid(),
                  role: "user",
                  content: {
                    content_type: "text",
                    parts: [question],
                  },
                },
              ],
              model: "text-davinci-002-render",
              parent_message_id: AI.uid(),
            }),
          }
        );
        resolve(res.body);
      } catch (e) {
        if (e === "CLOUDFLARE") {
          reject("CLOUDFLARE");
        } else {
          reject("ERROR");
        }
      }
    });
  }
}
