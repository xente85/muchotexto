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

  if (type === "action") {
    if (data.type === 'copyToTheClipboard') {
      const { text, infoText } = data.data;
      navigator.clipboard.writeText(text);
      ui.openModalText(infoText);
    }
    return;
  }

  ui.openModalText(data.text);
});

document.addEventListener("closeModal", () => {
  chrome.runtime.sendMessage({ message: "stopRequest" });
});

// Seleccionar todos los elementos <a> con la clase "miEnlace"
const enlaces = document.querySelectorAll("a");
enlaces.forEach(function (enlace) {
  enlace.addEventListener("click", (event) => {
    // Verificar si la tecla Shift está presionada
    if (event.shiftKey) {
      // Evitar el comportamiento predeterminado del enlace
      event.preventDefault();
      chrome.runtime.sendMessage({ message: "link", linkUrl: enlace.href });
    }
  });
});
