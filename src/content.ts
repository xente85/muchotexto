import { UI } from "./utils/ui";
import { AI } from "./utils/ai";

const port = chrome.runtime.connect();
const ui = new UI();

chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;
  if (type === "loading") ui.openModalLoading();
  else {
    AI.getPromptByType(type, data)
      .then((prompt) => port.postMessage({ prompt }))
      .catch((e) => ui.openModalError(`Error: ${e} - ${request}`));
  }
});

port.onMessage.addListener((answer) => {
  AI.processResponse(answer)
    .then((response) => {
      if (response) ui.openModalText(response);
    })
    .catch((e) => ui.openModalError(`Error: ${e}`));
});
