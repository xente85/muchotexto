function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const url = "https://vicenalvaro.alwaysdata.net/";

async function getArticle(link: string, controller: AbortController) {
  try {
    const response = await fetch(url, {
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
      return result;
    }
  } catch (err) {
    return { error: `Error: ${err}` };
  }
}

export { sleep, getArticle };
