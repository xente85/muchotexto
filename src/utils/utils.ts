function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// const url = "http://localhost:3000/";
const url = "https://muchotexto-api.onrender.com/";

async function getArticle(link: string, controller: AbortController) {
  try {
    const response = await fetch(url + "link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        link,
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('result', result);
      return result;
    }
  } catch (err) {
    return { error: `Error: ${err}` };
  }
}

async function getResponseIA(prompt: string, controller: AbortController) {
  try {
    const response = await fetch(url + "prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (err) {
    return { error: `Error: ${err}` };
  }
}

export { sleep, getArticle, getResponseIA };
