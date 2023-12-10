import { sleep } from "./utils";

export class AI {
  static requestInfo(question: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(
          "https://chat.openai.com/backend-api/conversation",
          await AI.getFetchInfo(question)
        );
        resolve(res.body);
      } catch (e) {
        if (e === "CLOUDFLARE") {
          reject(chrome.i18n.getMessage("errorReset"));
        } else {
          reject(chrome.i18n.getMessage("errorLogin"));
          await sleep(3000);
          chrome.tabs.create({ url: "https://chat.openai.com/chat" });
        }
      }
    });
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

  static async getFetchInfo(question: string) {
    const accessToken = await AI.getToken();
    return {
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
    };
  }
}
