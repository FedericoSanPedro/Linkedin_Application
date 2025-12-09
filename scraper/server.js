import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "Falta la URL" });
  }

  try {
    console.log("Scrapeando:", url);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Navegar a la URL proporcionada
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Obtener contenido de prueba (ejemplo: título de la página)
    const title = await page.title();

    // Podés scrapear más cosas:
    // const description = await page.$eval("meta[name='description']", el => el.content);

    await browser.close();

    res.json({
      success: true,
      data: {
        title,
        url,
        message: "Scrapeo exitoso",
      },
    });
  } catch (error) {
    console.error("Error en scraper:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Backend scraper listo en http://localhost:3000");
});
