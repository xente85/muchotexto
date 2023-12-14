document.addEventListener("DOMContentLoaded", () => {
  document.title = chrome.i18n.getMessage("extensionName");

  const title = document.getElementById("title");
  if (title) title.innerText = chrome.i18n.getMessage("extensionName");

  const instruction = document.getElementById("mt-instructions");
  if (instruction) instruction.innerText = chrome.i18n.getMessage("uiInstruction");  

  chrome.runtime.sendMessage({ message: "isLoggedInChatGPT" }, (isLoggedInChatGPT) => {
    console.log('isLoggedInChatGPT', isLoggedInChatGPT);
    const loginChatgpt = document.getElementById("mt-instructions-login-chatgpt");
    if (!isLoggedInChatGPT) {
      if (loginChatgpt) {
        loginChatgpt.classList.remove("ok");
        loginChatgpt.classList.add("error");
        loginChatgpt.innerHTML = chrome.i18n.getMessage("uiInstructionLoginError");
      }
    } else {
      if (loginChatgpt) {
        loginChatgpt.classList.remove("error");
        loginChatgpt.classList.add("ok");
        loginChatgpt.innerHTML = chrome.i18n.getMessage("uiInstructionLoginOk");
      }
    }
  });
});
