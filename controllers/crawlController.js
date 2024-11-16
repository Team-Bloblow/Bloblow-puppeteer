const puppeteer = require("puppeteer");

const crawlPostData = async (req, res) => {
  const link = req.params.postLink;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome-stable",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--single-process",
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1080, height: 1024,
    }
  });
  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto(link);
    await page.waitForSelector("iframe");

    const iframeURL = await page.evaluate(() => document.querySelector("iframe").src);

    await page.goto(iframeURL);
    await page.waitForNetworkIdle();

    const content = await page.evaluate(() =>
      JSON.stringify(document.querySelector(".se-main-container").textContent)
    );
    const commentCount = await page.evaluate(
      () => parseInt(document.querySelector("._commentCount").innerText.trim()) || 0
    );
    const likeCount = await page.evaluate(
      () => parseInt(document.querySelector(".u_cnt._count").innerText.trim()) || 0
    );
    const isAd = await Promise.resolve(
      validateAdKeyword.some((adKeyword) => content.includes(adKeyword))
    );

    return res.status(200).json({
      content,
      likeCount,
      commentCount,
      isAd,
    }) ;
  } catch (e) {
    console.error(e);
    return res.status(500).send({ message: `[ServerError] Error occured crawling ${e}` });
  } finally {
    await browser.close();
  }
}

module.exports = { crawlPostData };
