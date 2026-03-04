const { chromium } = require("playwright");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// Cargar .env si existe (sin dependencias externas)
function cargarEnv() {
  const ruta = path.join(__dirname, ".env");
  if (!fs.existsSync(ruta)) return;
  for (const linea of fs.readFileSync(ruta, "utf8").split("\n")) {
    const [clave, ...resto] = linea.split("=");
    if (clave && resto.length) {
      process.env[clave.trim()] = resto.join("=").trim();
    }
  }
}
cargarEnv();

const SESSION_FILE = path.join(__dirname, ".session.json");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function preguntar(texto) {
  return new Promise((resolve) => rl.question(texto, resolve));
}

function sortear(cantidad, min, max) {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, cantidad).sort((a, b) => a - b);
}

function parseEuros(texto) {
  return parseFloat(texto.replace(/[€\s]/g, "").replace(",", "."));
}

// Intenta recuperar sesión guardada. Devuelve { context, page } si sigue activa, null si no.
async function cargarSesion(browser) {
  if (!fs.existsSync(SESSION_FILE)) return null;
  console.log("Sesión guardada encontrada, cargando...");
  const context = await browser.newContext({ storageState: SESSION_FILE });
  const page = await context.newPage();
  await page.goto("https://juegos.loteriasyapuestas.es/jugar/la-primitiva/apuesta", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  // Si aparece el botón de "Entrar", la sesión no es válida en el servidor
  const noIdentificado = await page.locator("#idIniSesion").isVisible().catch(() => false);
  if (noIdentificado) {
    console.log("Sesión expirada o cerrada. Borrando sesión guardada...");
    await context.close();
    fs.unlinkSync(SESSION_FILE);
    return null;
  }
  console.log("Sesión activa.");
  return { context, page };
}

// Login manual: el usuario resuelve el CAPTCHA en el navegador abierto.
async function loginManual(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://juegos.loteriasyapuestas.es/acceder/login?lang=es");

  try {
    await page.waitForSelector("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll", {
      timeout: 5000,
    });
    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");
    console.log("Cookies aceptadas.");
  } catch {
    console.log("Sin banner de cookies, continuando...");
  }

  // Prerrellenar credenciales del .env si existen (el usuario solo tiene que resolver el CAPTCHA)
  const usuario = process.env.PRIMITIVA_USUARIO;
  const password = process.env.PRIMITIVA_PASSWORD;
  if (usuario) await page.fill("#username", usuario);
  if (password) {
    await page.fill("#password", password);
    await page.press("#password", "Tab");
  }

  console.log("\nEl navegador está abierto. Completa el login manualmente (resuelve el CAPTCHA si aparece).");
  console.log("El script continuará automáticamente al detectar que has entrado.\n");

  // Esperar a que el usuario complete el login
  await page.waitForURL("**/jugar/cas/apuestas/historicos", { timeout: 120000 });
  console.log("Login detectado. Guardando sesión...");

  // Guardar sesión para próximas ejecuciones
  await context.storageState({ path: SESSION_FILE });
  console.log("Sesión guardada en .session.json\n");

  // Navegar al formulario
  await page.goto("https://juegos.loteriasyapuestas.es/jugar/la-primitiva/apuesta", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });

  return { context, page };
}

async function main() {
  // Argumento de línea de comandos: node primitiva-auto.js [nApuestas]
  // Si se pasa, sobreescribe .env y fuerza interacción en confirmaciones.
  const argApuestas = process.argv[2] ? parseInt(process.argv[2]) : null;
  const modoInteractivo = argApuestas !== null;

  // --- PASO 1: Cuántas apuestas ---
  let nApuestas;
  if (modoInteractivo) {
    nApuestas = argApuestas;
    console.log(`Apuestas (argumento): ${nApuestas}`);
  } else if (process.env.PRIMITIVA_APUESTAS) {
    nApuestas = parseInt(process.env.PRIMITIVA_APUESTAS);
    console.log(`Apuestas (desde .env): ${nApuestas}`);
  } else {
    nApuestas = parseInt(await preguntar("¿Cuántas apuestas? (1-8): "));
  }

  if (isNaN(nApuestas) || nApuestas < 1 || nApuestas > 8) {
    console.error("Número de apuestas inválido. Debe ser entre 1 y 8.");
    rl.close();
    process.exit(1);
  }

  // --- PASO 2: Generar números ---
  const apuestas = [];
  for (let i = 0; i < nApuestas; i++) {
    apuestas.push(sortear(6, 1, 49));
  }
  const reintegro = Math.floor(Math.random() * 10);

  console.log("\n--- Números generados ---");
  apuestas.forEach((nums, i) => {
    console.log(`Apuesta ${i + 1}: ${nums.map((n) => String(n).padStart(2, "0")).join(" - ")}`);
  });
  console.log(`Reintegro: ${reintegro}`);
  console.log("-------------------------\n");

  if (!modoInteractivo && process.env.PRIMITIVA_CONFIRMAR_NUMEROS === "si") {
    console.log("Confirmación de números omitida (PRIMITIVA_CONFIRMAR_NUMEROS=si).");
  } else {
    const conf = await preguntar("¿Rellenar el formulario con estos números? (s/n): ");
    if (conf.toLowerCase() !== "s") {
      console.log("Cancelado.");
      rl.close();
      return;
    }
  }

  // --- PASO 3: Login (sesión guardada o manual) ---
  const browser = await chromium.launch({ headless: false, slowMo: 200 });

  let sesion = await cargarSesion(browser);
  if (!sesion) {
    sesion = await loginManual(browser);
  }
  const { page } = sesion;

  await page.waitForSelector(".botonera-combinaciones", { timeout: 10000 });

  // --- PASO 4: Limpiar formulario (por si quedó algo de una sesión anterior) ---
  const btnVaciar = page.locator("a.vaciar-boleto:has(span.texto-papelera)");
  const clases = await btnVaciar.getAttribute("class");
  if (clases && clases.includes("desactivado")) {
    console.log("Formulario ya vacío.");
  } else {
    console.log("Limpiando formulario...");
    await btnVaciar.click();
    await page.waitForTimeout(300);
  }

  // --- PASO 5: Rellenar combinaciones ---
  console.log("Rellenando combinaciones...");
  for (let i = 0; i < apuestas.length; i++) {
    const nums = apuestas[i];
    console.log(`Apuesta ${i + 1}: ${nums.map((n) => String(n).padStart(2, "0")).join(" - ")}`);
    for (const num of nums) {
      await page.click(`.botonera-combinaciones .boton-boleto[value="${num}"]`);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(400);
  }

  // --- PASO 5: Reintegro ---
  console.log(`Reintegro: ${reintegro}`);
  await page.click(`.botonera-reintegro .boton-boleto[value="${reintegro}"]`);
  await page.waitForTimeout(500);

  // --- PASO 6: Comprobar saldo ---
  let saldoTexto = "no disponible";
  let totalTexto = "no disponible";
  let saldo = null;
  let total = null;

  try {
    await page.waitForSelector("span.total-compra", { timeout: 5000 });
    saldoTexto = (await page.textContent("span.titulo-valor")).trim();
    totalTexto = (await page.textContent("span.total-compra")).trim();
    saldo = parseEuros(saldoTexto);
    total = parseEuros(totalTexto);
  } catch {
    console.log("Aviso: no se pudieron leer los importes del formulario.");
  }

  let saldoInsuficiente = saldo !== null && total !== null && saldo < total;

  console.log("\n========================================");
  console.log(`  Saldo disponible : ${saldoTexto}`);
  console.log(`  Total apuesta    : ${totalTexto}`);
  if (saldoInsuficiente) {
    console.log("  !! SALDO INSUFICIENTE — recarga antes de confirmar.");
  }
  console.log("========================================\n");

  // --- PASO 7: Confirmación final ---
  // Si el saldo es insuficiente, ofrece esperar a hacer una recarga manual
  while (saldoInsuficiente) {
    console.log("\n!! SALDO INSUFICIENTE — no se puede confirmar el pago.");
    const esperar = await preguntar("¿Esperar a recargar saldo manualmente? (s=esperar, n=salir): ");
    if (esperar.toLowerCase() !== "s") {
      console.log("Cancelado. Cerrando navegador.");
      rl.close();
      await browser.close();
      return;
    }

    await preguntar("Recarga el saldo en el navegador y pulsa Enter cuando estés listo...");

    // Renavegar al formulario y re-rellenar con los mismos números
    console.log("Recargando formulario...");
    await page.goto("https://juegos.loteriasyapuestas.es/jugar/la-primitiva/apuesta", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForSelector(".botonera-combinaciones", { timeout: 10000 });

    const btnV = page.locator("a.vaciar-boleto:has(span.texto-papelera)");
    const cls = await btnV.getAttribute("class");
    if (!cls || !cls.includes("desactivado")) {
      await btnV.click();
      await page.waitForTimeout(300);
    }

    for (let i = 0; i < apuestas.length; i++) {
      for (const num of apuestas[i]) {
        await page.click(`.botonera-combinaciones .boton-boleto[value="${num}"]`);
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(400);
    }
    await page.click(`.botonera-reintegro .boton-boleto[value="${reintegro}"]`);
    await page.waitForTimeout(500);

    // Re-leer saldo y total
    try {
      await page.waitForSelector("span.total-compra", { timeout: 5000 });
      saldoTexto = (await page.textContent("span.titulo-valor")).trim();
      totalTexto = (await page.textContent("span.total-compra")).trim();
      saldo = parseEuros(saldoTexto);
      total = parseEuros(totalTexto);
    } catch {
      console.log("Aviso: no se pudieron leer los importes del formulario.");
    }

    saldoInsuficiente = saldo !== null && total !== null && saldo < total;

    console.log("\n========================================");
    console.log(`  Saldo disponible : ${saldoTexto}`);
    console.log(`  Total apuesta    : ${totalTexto}`);
    if (saldoInsuficiente) {
      console.log("  !! SALDO INSUFICIENTE — recarga antes de confirmar.");
    } else {
      console.log("  Saldo suficiente.");
    }
    console.log("========================================\n");
  }

  // Confirmación de pago
  if (!modoInteractivo && process.env.PRIMITIVA_CONFIRMAR_PAGO === "si") {
    console.log("Confirmación de pago omitida (PRIMITIVA_CONFIRMAR_PAGO=si).");
  } else {
    const confPago = await preguntar("¿Confirmar y pagar? (s/n): ");
    if (confPago.toLowerCase() !== "s") {
      console.log("Pago cancelado. Cerrando navegador.");
      rl.close();
      await browser.close();
      return;
    }
  }

  await page.waitForSelector(".boton-confirmar:not([disabled])", { timeout: 5000 }).catch(() => {
    console.log("Aviso: el botón de confirmar podría no estar activo aún.");
  });

  await page.click(".boton-confirmar");
  console.log("Apuesta enviada.");

  await page.waitForTimeout(3000);

  const cerrar = await preguntar("\n¿Cerrar el navegador? (s/n): ");
  rl.close();
  if (cerrar.toLowerCase() === "s") {
    await browser.close();
    console.log("Navegador cerrado.");
  } else {
    console.log("Navegador abierto. Ciérralo manualmente cuando quieras.");
  }
}

main().catch((err) => {
  console.error("Error inesperado:", err.message);
  rl.close();
  process.exit(1);
});
