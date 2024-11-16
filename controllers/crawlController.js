const puppeteer = require("puppeteer");
const { sanitizeHtmlEntity } = require("../utils/sanitizeHtmlEntity");

const crawlPostData = async (req, res) => {
  const link = req.params.postLink;
  const title = req.query.title;
  const description = req.query.description;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote",
    ],
    ignoreHTTPSErrors: true,
  });
  try {
    console.log("start crawling");
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
      title: sanitizeHtmlEntity(title),
      link,
      description: sanitizeHtmlEntity(description),
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
