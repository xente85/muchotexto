import { UI } from "./utils/ui";

const ui = new UI().mount();

chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;

  if (type === "loading") {
    ui.openModalLoading();
    return;
  }

  if (type === "error") {
    ui.openModalError(data.error);
    return;
  }

  ui.openModalText(data.text);
});
