function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getArticle(link: string) {
  try {
    const response = await fetch(
      "https://article-extractor-api.onrender.com/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (err) {
    return { error: `Error: ${err}` };
  }
}

export { sleep, getArticle };