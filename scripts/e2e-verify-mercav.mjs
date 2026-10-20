import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "/Users/patodev/.gemini/antigravity/brain/b289acf1-ee40-4494-8014-a89c3daebb48";
const BRAVE_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

const results = {
  consoleErrors: [],
  consoleWarnings: [],
  failedRequests: [],
  steps: [],
};

async function run() {
  console.log("=== INICIANDO VERIFICACIÓN E2E DE MERCAV.LAT CON PLAYWRIGHT ===");

  const browser = await chromium.launch({
    executablePath: fs.existsSync(BRAVE_PATH) ? BRAVE_PATH : undefined,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") {
      console.log(`[BROWSER ERROR]: ${text}`);
      results.consoleErrors.push(text);
    } else if (msg.type() === "warning") {
      results.consoleWarnings.push(text);
    }
  });

  page.on("requestfailed", (req) => {
    const failure = req.failure()?.errorText || "Unknown";
    console.log(`[NETWORK FAIL]: ${req.url()} - ${failure}`);
    results.failedRequests.push({ url: req.url(), failure });
  });

  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      console.log(`[HTTP ${res.status()}]: ${res.url()}`);
      results.failedRequests.push({ url: res.url(), status: res.status() });
    }
  });

  // Step 1: Landing Page Desktop
  console.log("\n1. Navegando a https://mercav.lat ...");
  await page.goto("https://mercav.lat", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  const title = await page.title();
  console.log(`- Título de la página: "${title}"`);
  const landingShot = path.join(ARTIFACTS_DIR, "01-landing-desktop.png");
  await page.screenshot({ path: landingShot });
  console.log(`- Captura guardada: ${landingShot}`);
  results.steps.push({ step: "Landing Desktop", title, screenshot: landingShot, url: page.url() });

  // Step 1.5: Dismiss Cookie Banner if present
  console.log("\n1.5. Verificando cartel de cookies...");
  const cookieAcceptBtn = page.locator('button:has-text("Aceptar todas"), button:has-text("Solo necesarias")').first();
  if (await cookieAcceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log("- Cartel de cookies visible. Haciendo click en 'Aceptar todas'...");
    await cookieAcceptBtn.click();
    await page.waitForTimeout(1000);
  } else {
    console.log("- No se mostró cartel de cookies o ya fue aceptado.");
  }

  // Step 2: Theme Toggle Click
  console.log("\n2. Probando botón de conmutación de tema (Light / Dark)...");
  const themeToggle = page.locator('button[aria-label*="modo"], button[title*="modo"]').first();
  if (await themeToggle.isVisible()) {
    console.log("- Conmutando a Modo Claro...");
    await themeToggle.click();
    await page.waitForTimeout(1000);
    const isLight = await page.evaluate(() => document.documentElement.classList.contains("light"));
    console.log(`- ¿Modo claro activo?: ${isLight}`);
    const lightShot = path.join(ARTIFACTS_DIR, "02-landing-light.png");
    await page.screenshot({ path: lightShot });
    console.log(`- Captura guardada: ${lightShot}`);
    results.steps.push({ step: "Modo Claro", isLight, screenshot: lightShot });

    console.log("- Restaurando a Modo Oscuro...");
    await themeToggle.click();
    await page.waitForTimeout(500);
  }

  // Step 3: Click "BUSINESS" nav link
  console.log("\n3. Haciendo click en enlace de 'BUSINESS'...");
  const businessLink = page.locator('header a:has-text("BUSINESS"), nav a:has-text("BUSINESS")').first();
  if (await businessLink.isVisible()) {
    await businessLink.click();
    await page.waitForTimeout(2500);
    const busUrl = page.url();
    console.log(`- Navegó a: ${busUrl}`);
    const busShot = path.join(ARTIFACTS_DIR, "03-business.png");
    await page.screenshot({ path: busShot });
    console.log(`- Captura guardada: ${busShot}`);
    results.steps.push({ step: "Business", url: busUrl, screenshot: busShot });
  }

  // Step 4: Click "PWN" nav link
  console.log("\n4. Navegando a Mercav PWN...");
  const pwnLink = page.locator('header a:has-text("PWN"), nav a:has-text("PWN")').first();
  if (await pwnLink.isVisible()) {
    await pwnLink.click();
    await page.waitForTimeout(2500);
    const pwnUrl = page.url();
    console.log(`- Navegó a: ${pwnUrl}`);
    const pwnShot = path.join(ARTIFACTS_DIR, "04-pwn.png");
    await page.screenshot({ path: pwnShot });
    console.log(`- Captura guardada: ${pwnShot}`);
    results.steps.push({ step: "Pwn", url: pwnUrl, screenshot: pwnShot });
  } else {
    await page.goto("https://mercav.lat/pwn", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const pwnShot = path.join(ARTIFACTS_DIR, "04-pwn.png");
    await page.screenshot({ path: pwnShot });
    results.steps.push({ step: "Pwn Direct", url: page.url(), screenshot: pwnShot });
  }

  // Step 5: Click "CALENDARIO" nav link
  console.log("\n5. Navegando a Calendario...");
  await page.goto("https://mercav.lat/calendario", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const calUrl = page.url();
  console.log(`- Navegó a: ${calUrl}`);
  const calShot = path.join(ARTIFACTS_DIR, "05-calendario.png");
  await page.screenshot({ path: calShot });
  console.log(`- Captura guardada: ${calShot}`);
  results.steps.push({ step: "Calendario", url: calUrl, screenshot: calShot });

  // Step 6: Navegación a KOSHER
  console.log("\n6. Navegando a Mercav Kosher (/kosher)...");
  await page.goto("https://mercav.lat/kosher", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  const kosherShot = path.join(ARTIFACTS_DIR, "06-kosher.png");
  await page.screenshot({ path: kosherShot });
  console.log(`- Captura guardada: ${kosherShot}`);
  results.steps.push({ step: "Kosher", url: page.url(), screenshot: kosherShot });

  // Step 7: Login Form
  console.log("\n7. Navegando a /login y probando formulario...");
  await page.goto("https://mercav.lat/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const loginSubmit = page.locator('button[type="submit"]').first();

  console.log(`- ¿Input email visible?: ${await emailInput.isVisible()}`);
  console.log(`- ¿Input password visible?: ${await passwordInput.isVisible()}`);
  console.log(`- ¿Botón submit visible?: ${await loginSubmit.isVisible()}`);

  if (await emailInput.isVisible()) {
    await emailInput.fill("usuario@empresa.com");
    await passwordInput.fill("PasswordSegura2026!");
  }
  const loginShot = path.join(ARTIFACTS_DIR, "07-login.png");
  await page.screenshot({ path: loginShot });
  console.log(`- Captura guardada: ${loginShot}`);
  results.steps.push({ step: "Login", url: page.url(), screenshot: loginShot });

  // Step 8: Mobile Viewport Verification (iPhone 14 - 390x844)
  console.log("\n8. Probando Viewport Móvil (390 x 844)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("https://mercav.lat", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(2000);

  // Dismiss cookie if on mobile
  const mobCookie = mobilePage.locator('button:has-text("Aceptar todas"), button:has-text("Solo necesarias")').first();
  if (await mobCookie.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mobCookie.click();
    await mobilePage.waitForTimeout(800);
  }

  // Check for horizontal overflow bug
  const hasHorizontalOverflow = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`- ¿Existe desbordamiento horizontal en móvil en portada?: ${hasHorizontalOverflow}`);

  const mobileShot = path.join(ARTIFACTS_DIR, "08-mobile-landing.png");
  await mobilePage.screenshot({ path: mobileShot });
  console.log(`- Captura guardada: ${mobileShot}`);
  results.steps.push({ step: "Mobile Landing", hasHorizontalOverflow, screenshot: mobileShot });

  // Mobile Menu Click
  const menuButton = mobilePage.locator('button[aria-label*="menú"], button[aria-label*="menu"]').first();
  if (await menuButton.isVisible()) {
    console.log("- Abriendo menú hamburguesa móvil...");
    await menuButton.click();
    await mobilePage.waitForTimeout(1000);
    const menuShot = path.join(ARTIFACTS_DIR, "09-mobile-menu.png");
    await mobilePage.screenshot({ path: menuShot });
    console.log(`- Captura guardada: ${menuShot}`);
    results.steps.push({ step: "Mobile Menu", screenshot: menuShot });
  }

  await mobileContext.close();
  await context.close();
  await browser.close();

  console.log("\n=== VERIFICACIÓN E2E COMPLETADA CON ÉXITO ===");
  fs.writeFileSync(path.join(ARTIFACTS_DIR, "e2e-results.json"), JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error("FATAL ERROR IN PLAYWRIGHT TEST:", err);
  process.exit(1);
});
