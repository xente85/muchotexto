document.addEventListener("DOMContentLoaded", () => {
  document.title = chrome.i18n.getMessage("extensionName");

  const title = document.getElementById("title");
  if (title)
    title.innerText = chrome.i18n.getMessage("extensionName");

  const instruction = document.getElementById("instructions");
  if (instruction)
    instruction.innerText = chrome.i18n.getMessage("uiInstruction");
});
