import { UI } from "./utils/ui";

const ui = new UI().mount();

chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;

  if (type === "title") {
    ui.openModalTitle(data);
    return;
  }

  if (type === "loading") {
    ui.openModalLoading(data.text);
    return;
  }

  if (type === "error") {
    ui.openModalError(data.error);
    return;
  }

  if (type === "actions") {
    ui.openModalActions(data);
    return;
  }

  ui.openModalText(data.text);
});
