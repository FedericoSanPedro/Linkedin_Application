import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

async function loginLinkedIn(page) {
  console.log("Iniciando login...");

  await page.goto("https://www.linkedin.com/login", {
    waitUntil: "domcontentloaded"
  });

  await page.type("#username", process.env.LINKEDIN_EMAIL);
  await page.type("#password", process.env.LINKEDIN_PASSWORD);

  await page.click("button[type=submit]");

  // Esperamos a que aparezca la barra superior (login exitoso)
  await page.waitForSelector("#global-nav-search", { timeout: 60000 });

  console.log("Login completado.");
}

async function scrapeProfile(url) {
  const browser = await puppeteer.launch({
    headless: false, 
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // LOGIN
    await loginLinkedIn(page);

    // IR AL PERFIL
    console.log("Entrando al perfil:", url);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 20000 });


    const html = await page.content();
    const $ = cheerio.load(html);

    const name = $("h1").first().text().trim();
    const headline = $(".pv-text-details__left-panel span").first().text().trim();

    let experiences = [];
    $(".experience-item").each((i, el) => {
      experiences.push($(el).text().trim());
    });

    await browser.close();

    return {
      name,
      headline,
      experiences
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  console.log("Body recibido:", req.body);

  if (!url) return res.status(400).json({ error: "URL faltante" });

  try {
    const data = await scrapeProfile(url);
    res.json(data);
  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).json({ error: "Scraping falló", details: error.message });
  }
});

app.listen(3000, () => {
  console.log("Scraper backend corriendo en http://localhost:3000");
});
