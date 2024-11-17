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
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 1080, height: 1024,
    }
  });

  const TIMEOUT = 100000;

  try {
    const page = await browser.newPage();
    console.log("Page created");

    await page.setDefaultNavigationTimeout(TIMEOUT);

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    await page.setRequestInterception(true);
    
    page.on("request", (req) => {
      const blockResources = ["image", "stylesheet", "font", "media", "other"];
      if (blockResources.includes(req.resourceType())) req.abort();
      else req.continue();
    });

    console.log(`Navigated to ${decodedLink}`);
    await page.goto(decodedLink, { waitUntil: "networkidle2", timeout: TIMEOUT });

    await page.waitForSelector("iframe", { timeout: TIMEOUT });

    const iframeURL = await page.evaluate(() => document.querySelector("iframe").src);

    if (!iframeURL || !iframeURL.startsWith("https://blog.naver.com")) {
      throw new Error("Invalid iframe URL");
    }

    console.log(`Navigating to iframe URL: ${iframeURL}`);
    await page.goto(iframeURL, { waitUntil: "networkidle2", timeout: TIMEOUT });
    await page.waitForNetworkIdle({ timeout: TIMEOUT });

    console.log('network status: idle');

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
    console.error(e);
    return res.status(500).send({ message: `[ServerError] Error occured crawling ${e}` });
  } finally {
    try {
      await browser.close();
      console.log("Browser closed successfully.");
    } catch (closeError) {
      console.error("Error closing the browser:", closeError.message);
    }
  }
}

module.exports = { crawlPostData };
