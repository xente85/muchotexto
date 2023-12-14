import { sleep } from "./utils";

export class AI {
  private accessToken: string | null = null;

  public requestInfo(question: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(
          "https://chat.openai.com/backend-api/conversation",
          await this.getFetchInfo(question)
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

  public getToken(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (this.accessToken) resolve(this.accessToken);

      const resp = await fetch("https://chat.openai.com/api/auth/session");
      if (resp.status === 403) {
        reject("CLOUDFLARE");
        this.accessToken = null;
      }
      try {
        const data = await resp.json();
        if (!data.accessToken) {
          reject("ERROR");
          this.accessToken = null;
        }
        this.accessToken = data.accessToken;
        resolve(data.accessToken);
      } catch (err) {
        reject("ERROR");
        this.accessToken = null;
      }
    });
  }

  private async getFetchInfo(question: string) {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (await this.getToken()),
      },
      body: JSON.stringify({
        action: "next",
        messages: [
          {
            id: this.uid(),
            role: "user",
            content: {
              content_type: "text",
              parts: [question],
            },
          },
        ],
        model: "text-davinci-002-render",
        parent_message_id: this.uid(),
      }),
    };
  }

  private uid() {
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
}
