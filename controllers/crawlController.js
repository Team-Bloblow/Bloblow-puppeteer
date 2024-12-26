const puppeteer = require("puppeteer");
const { validateAdKeyword } = require("../utils/validateAdKeyword");

const crawlPostData = async (req, res) => {
  const link = req.query.postLink;
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
    defaultViewport: null,
    protocolTimeout: 120000,
  });

  const TIMEOUT = 100000;

  try {
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(TIMEOUT);

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    await page.setRequestInterception(true);

    page.on("request", (req) => {
      const blockResources = ["image", "stylesheet", "font", "media", "other"];
      if (blockResources.includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.goto(decodedLink, { waitUntil: "networkidle2", timeout: TIMEOUT });

    await page.waitForSelector("iframe", { timeout: TIMEOUT });

    const iframeURL = await page.evaluate(() => document.querySelector("iframe").src);

    if (!iframeURL || !iframeURL.startsWith("https://blog.naver.com")) {
      throw new Error("Invalid iframe URL");
    }

    await page.goto(iframeURL, { waitUntil: "networkidle2", timeout: TIMEOUT });

    await page.waitForSelector(".se-main-container", { timeout: TIMEOUT });

    const content = await page.evaluate(() => {
      const element = document.querySelector(".se-main-container");
      return element ? element.textContent : "Content not found";
    });
    const commentCount = await page.evaluate(() => {
      const element = document.querySelector("._commentCount");
      return element ? parseInt(element.innerText.trim()) || 0 : 0;
    });
    const likeCount = await page.evaluate(() => {
      const element = document.querySelector(".u_cnt._count");
      return element ? parseInt(element.innerText.trim()) || 0 : 0;
    });
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
    return res.status(500).send({ message: `[ServerError] Error occured crawling ${e}` });
  } finally {
    await browser.close();
  }
}

module.exports = { crawlPostData };
