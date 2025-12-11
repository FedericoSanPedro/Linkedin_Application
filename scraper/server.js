import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// ----------------------------
// LOGIN A LINKEDIN
// ----------------------------
async function loginLinkedIn(page) {
  console.log("Iniciando login...");

  await page.goto("https://www.linkedin.com/login", {
    waitUntil: "domcontentloaded"
  });

  await page.type("#username", process.env.LINKEDIN_EMAIL);
  await page.type("#password", process.env.LINKEDIN_PASSWORD);

  await page.click("button[type=submit]");

  // Esperamos a que aparezca la barra superior (login OK)
  await page.waitForSelector("#global-nav-search", { timeout: 60000 });

  console.log("Login completado.");
}

// ----------------------------
// SCRAPING DEL PERFIL
// ----------------------------
async function scrapeProfile(url) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  try {
    await loginLinkedIn(page);

    console.log("Entrando al perfil:", url);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Esperar el nombre del perfil
    await page.waitForSelector("h1", { timeout: 30000 });

    // ----------------------------
    // GUARDAR HTML PARA DEBUG
    // ----------------------------
    const html = await page.content();
    console.log("HTML LENGTH:", html.length);
    fs.writeFileSync("debug.html", html);

    const $ = cheerio.load(html);

    // ----------------------------
    // EXTRACCIÓN DE DATOS
    // ----------------------------

    // NAME
    const name = $("h1").first().text().trim();

    // HEADLINE — probamos varios selectores
    const headline =
      $(".pv-text-details__left-panel .text-body-medium").first().text().trim() ||
      $(".pv-text-details__right-panel .text-body-medium").first().text().trim() ||
      $("div.text-body-medium").first().text().trim();

    // LOCATION
    const location = $("span.text-body-small.inline.t-black--light.break-words")
    .first()
    .text()
    .trim();

    // ABOUT — selector estable 2025
    function extractAbout($) {
      // Localizar el header About y luego su sección contenedora
      const aboutHeader = $("h2 span[aria-hidden=true]")
        .filter((i, el) => $(el).text().trim().toLowerCase() === "about")
        .first();

      if (!aboutHeader.length) return "";

      const aboutSection = aboutHeader.closest("section");
      if (!aboutSection.length) return "";

      // El texto está dentro de un div con clase que contiene "inline-show-more-text"
      const aboutDiv = aboutSection.find("div[class*='inline-show-more-text']").first();
      if (!aboutDiv.length) return "";

      const aboutSpan = aboutDiv.find("span[aria-hidden=true]").first();
      if (!aboutSpan.length) return "";

      return aboutSpan
        .text()
        .replace(/\s+/g, " ")
        .trim();
    }

    const about = extractAbout($);
        
    // EXPERIENCIA

    function extractExperiences($) {
      const experiences = [];
    
      // 1) Encontrar el header "Experience"
      const expHeader = $("h2 span[aria-hidden=true]")
        .filter((i, el) => $(el).text().trim() === "Experience")
        .first();
    
      if (!expHeader.length) {
        console.log("⚠ No se encontró Experience");
        return [];
      }
    
      // 2) Encontrar la sección de Experience
      const expSection = expHeader.closest("section");
      if (!expSection.length) {
        console.log("⚠ No se encontró la sección de Experience");
        return [];
      }
    
      // 3) Encontrar el ul que contiene las experiencias (directamente después del header)
      const expList = expSection.find("ul").first();
      if (!expList.length) {
        console.log("⚠ No se encontró la lista de experiencias");
        return [];
      }
    
      // 4) Cada experiencia está en un <li> con clase artdeco-list__item
      const items = expList.find("li.artdeco-list__item");
      if (!items.length) {
        console.log("⚠ No se encontraron items de experiencia");
        return [];
      }
    
      items.each((i, el) => {
        const item = $(el);
    
        // --- Role/Title ---
        // El rol está en: div.hoverable-link-text.t-bold span[aria-hidden=true]
        const role = item
          .find("div.hoverable-link-text.t-bold span[aria-hidden=true]")
          .first()
          .text()
          .trim();
    
        // --- Company + Type ---
        // La compañía y tipo están en: span.t-14.t-normal span[aria-hidden=true] (formato: "Company · Type")
        const companyTypeRaw = item
          .find("span.t-14.t-normal span[aria-hidden=true]")
          .first()
          .text()
          .trim();
        
        let company = "";
        let type = "";
        if (companyTypeRaw.includes(" · ")) {
          const parts = companyTypeRaw.split(" · ");
          company = parts[0]?.trim() || "";
          type = parts[1]?.trim() || "";
        } else {
          // Si no hay " · ", asumimos que es solo la compañía
          company = companyTypeRaw;
        }
    
        // --- Period ---
        // El período está en: span.pvs-entity__caption-wrapper[aria-hidden=true]
        const period = item
          .find("span.pvs-entity__caption-wrapper[aria-hidden=true]")
          .first()
          .text()
          .trim();
    
        // --- Location ---
        // La ubicación está en span.t-14.t-normal.t-black--light que NO contiene pvs-entity__caption-wrapper
        let location = "";
        const locationContainer = item.find("span.t-14.t-normal.t-black--light").filter((idx, el) => {
          // Excluir el que contiene el periodo (tiene pvs-entity__caption-wrapper)
          return $(el).find("span.pvs-entity__caption-wrapper").length === 0;
        }).first();
        
        if (locationContainer.length) {
          location = locationContainer.find("span[aria-hidden=true]").first().text().trim();
        }
    
        // --- Description ---
        // La descripción está dentro de pvs-entity__sub-components > div[class*="inline-show-more-text"] > span[aria-hidden=true]
        // El div tiene clases como "inline-show-more-text--is-collapsed"
        let description = "";
        // Buscar dentro de los sub-componentes de la experiencia primero
        const subComponents = item.find("div.pvs-entity__sub-components");
        let descriptionDiv = null;
        if (subComponents.length) {
          descriptionDiv = subComponents.find("div[class*='inline-show-more-text']").first();
        }
        // Si no se encuentra en sub-components, buscar en todo el item
        if (!descriptionDiv || !descriptionDiv.length) {
          descriptionDiv = item.find("div[class*='inline-show-more-text']").first();
        }
        
        if (descriptionDiv && descriptionDiv.length) {
          const descriptionSpan = descriptionDiv.find("span[aria-hidden=true]").first();
          if (descriptionSpan.length) {
            // Extraer el texto y limpiar espacios múltiples
            description = descriptionSpan.text()
              .replace(/\s+/g, " ")
              .trim();
          }
        }
    
        // Solo agregar si hay al menos rol o compañía
        if (role || company) {
          experiences.push({
            role: role || "",
            company: company || "",
            type: type || "",
            period: period || "",
            location: location || "",
            description: description || ""
          });
        }
      });
    
      return experiences;
    }

    const experiences = extractExperiences($);

    await browser.close();

    return {
      name,
      headline,
      location,
      about,
      experiences
    };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

// ----------------------------
// ENDPOINT API
// ----------------------------
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
