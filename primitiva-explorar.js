const { chromium } = require("playwright");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function preguntar(texto) {
  return new Promise((resolve) => rl.question(texto, resolve));
}

async function main() {
  const usuario = await preguntar("Usuario (email/NIF): ");
  const password = await preguntar("Contraseña: ");
  rl.close();

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // --- LOGIN ---
  console.log("\nAbriendo navegador...");
  await page.goto("https://juegos.loteriasyapuestas.es/acceder/login?lang=es");

  // Aceptar cookies si aparece el banner
  try {
    await page.waitForSelector("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll", {
      timeout: 5000,
    });
    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");
    console.log("Cookies aceptadas.");
  } catch {
    console.log("No apareció el banner de cookies, continuando...");
  }

  await page.fill("#username", usuario);
  await page.fill("#password", password);
  await page.press("#password", "Tab"); // Dispara el blur para habilitar el botón
  await page.click("#btnLogin");

  // Esperar a que el login redirija a la página de historicos
  try {
    await page.waitForURL("**/jugar/cas/apuestas/historicos", { timeout: 15000 });
    console.log("Login exitoso!");
  } catch {
    console.error("No se pudo completar el login. Comprueba las credenciales o si hay CAPTCHA.");
    await page.pause();
    await browser.close();
    return;
  }

  // --- NAVEGAR AL FORMULARIO DE LA PRIMITIVA ---
  console.log("Navegando al formulario de La Primitiva...");
  await page.goto("https://juegos.loteriasyapuestas.es/jugar/la-primitiva/apuesta", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });

  // --- PAUSA PARA EXPLORACIÓN ---
  console.log("\n========================================");
  console.log("  MODO EXPLORACIÓN ACTIVO");
  console.log("========================================");
  console.log("El navegador está pausado.");
  console.log("1. Navega hasta el formulario de apuesta de La Primitiva");
  console.log("2. Haz clic en algún número para ver cómo se activa");
  console.log("3. Usa DevTools (F12) para inspeccionar los selectores");
  console.log("4. Anota los selectores de: números, reintegro y botón de apostar");
  console.log("5. Cierra el Inspector de Playwright cuando termines");
  console.log("========================================\n");

  await page.pause(); // Abre el Inspector de Playwright

  await browser.close();
  console.log("Exploración finalizada.");
}

main().catch((err) => {
  console.error("Error inesperado:", err.message);
  process.exit(1);
});
