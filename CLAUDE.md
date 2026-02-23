# Proyecto: Automatización de apuestas en La Primitiva

## Objetivo

Automatizar el proceso de generar números aleatorios para La Primitiva y rellenar el formulario de apuesta en la web oficial de Loterías y Apuestas del Estado:
`https://juegos.loteriasyapuestas.es`

---

## Ficheros del proyecto

| Fichero | Descripción |
|---|---|
| `primitiva.js` | Generador original de números. Solo consola, sin automatización web. |
| `primitiva-explorar.js` | Script de exploración con Playwright. Hace login y pausa para inspeccionar el formulario. No es el script definitivo. |
| `primitiva-auto.js` | **Script principal.** Genera números y automatiza el formulario completo. |
| `.env` | Credenciales y opciones. **No se sube al repo.** |
| `.env.example` | Plantilla pública del `.env`. |
| `.session.json` | Sesión guardada de Playwright. **No se sube al repo.** |
| `.gitignore` | Excluye `.env`, `.session.json` y `node_modules/`. |

---

## Estado actual: FUNCIONAL

El script `primitiva-auto.js` está completo y probado. Flujo:

1. Lee configuración del `.env` y argumentos de línea de comandos
2. Genera combinaciones aleatorias (6 números 1-49 + reintegro 0-9)
3. Muestra los números y pide confirmación (salvo que esté desactivada en `.env`)
4. Intenta cargar sesión guardada (`.session.json`)
   - Valida la sesión comprobando si aparece el botón `#idIniSesion` ("Entrar")
   - Si la sesión es inválida o no existe, abre el login manualmente, prerellena credenciales y espera a que el usuario pulse el botón (por CAPTCHA invisible)
   - Tras el login exitoso, guarda la sesión para futuras ejecuciones
5. Limpia el formulario pulsando el botón "Vaciar" global (`a.vaciar-boleto:has(span.texto-papelera)`) si no está desactivado
6. Rellena las combinaciones fila a fila pulsando `.botonera-combinaciones .boton-boleto[value="N"]`
7. Selecciona el reintegro en `.botonera-reintegro .boton-boleto[value="N"]`
8. Lee saldo (`span.titulo-valor`) y total de la apuesta (`span.total-compra`)
9. Si el saldo es insuficiente: bloquea el pago y cierra
10. Pide confirmación final y pulsa `.boton-confirmar`

---

## Selectores clave descubiertos

| Elemento | Selector |
|---|---|
| Cookies | `#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll` |
| Usuario login | `#username` |
| Password login | `#password` |
| Botón login | `#btnLogin` (requiere `Tab` en password antes para disparar `blur`) |
| Botón "Entrar" (no identificado) | `#idIniSesion` |
| URL tras login | `/jugar/cas/apuestas/historicos` |
| URL formulario | `/jugar/la-primitiva/apuesta` |
| Botones números (1-49) | `.botonera-combinaciones .boton-boleto[value="N"]` |
| Botones reintegro (0-9) | `.botonera-reintegro .boton-boleto[value="N"]` |
| Vaciar todo el formulario | `a.vaciar-boleto:has(span.texto-papelera)` (clase `desactivado` = ya vacío) |
| Saldo disponible | `span.titulo-valor` |
| Total apuesta | `span.total-compra` |
| Botón confirmar pago | `.boton-confirmar` |

---

## Configuración del `.env`

```
PRIMITIVA_USUARIO=tu_email_o_dni
PRIMITIVA_PASSWORD=tu_contraseña

# Opcional: fija el número de apuestas sin preguntar
PRIMITIVA_APUESTAS=

# Opcional: saltar confirmación de números generados (si = no pregunta)
PRIMITIVA_CONFIRMAR_NUMEROS=

# Opcional: saltar confirmación de pago. CUIDADO: paga sin preguntar.
PRIMITIVA_CONFIRMAR_PAGO=
```

## Uso

```bash
# Modo normal (usa .env para todo)
node primitiva-auto.js

# Modo interactivo forzado con N apuestas (ignora .env para apuestas y confirmaciones)
node primitiva-auto.js 3
```

---

## Entorno técnico

- Node.js
- Playwright (`npm install playwright`)
- Chromium (`npx playwright install chromium`)
- Plataforma: Windows 11
