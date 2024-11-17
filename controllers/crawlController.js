const puppeteer = require("puppeteer");
const { validateAdKeyword } = require("../utils/validateAdKeyword");

const crawlPostData = async (req, res) => {
  const link = req.query.postLink;
  console.log(req.query);
  const decodedLink = decodeURIComponent(link);

  const browser = await puppeteer.launch({
    headless: true,
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
    console.log("Page created");

    await page.setDefaultNavigationTimeout(100000);

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const blockResources = ["image", "stylesheet", "font"];
      if (blockResources.includes(req.resourceType())) req.abort();
      else req.continue();
    });

    console.log(`Navigated to ${decodedLink}`);
    await page.goto(decodedLink, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector("iframe", { timeout: 100000 });

    const iframeURL = await page.evaluate(() => document.querySelector("iframe").src);

    console.log(`Navigating to iframe URL: ${iframeURL}`);
    await page.goto(iframeURL, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForNetworkIdle({ timeout: 100000 });

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
