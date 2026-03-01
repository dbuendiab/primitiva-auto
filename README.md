# primitiva-auto

Herramientas para jugar a la lotería online con más comodidad:

- **Automatización de La Primitiva**: genera combinaciones aleatorias y las rellena automáticamente en la web de [Loterías y Apuestas del Estado](https://juegos.loteriasyapuestas.es), lista para apostar con un solo comando.
- **Bookmarklets de verificación**: comprueban tus aciertos en La Primitiva y Euromillones directamente desde la página del resguardo, con desglose por sorteo y apuesta.

---

## ¿Qué hace?

1. Genera los números al azar (6 números del 1 al 49 + reintegro)
2. Abre un navegador, inicia sesión en tu cuenta y navega al formulario de La Primitiva
3. Rellena las apuestas automáticamente
4. Comprueba que tienes saldo suficiente
5. Te pide confirmación antes de pagar

---

## Requisitos

- [Node.js](https://nodejs.org)
- Una cuenta en [juegos.loteriasyapuestas.es](https://juegos.loteriasyapuestas.es) con saldo

---

## Instalación

```bash
git clone https://github.com/dbuendiab/primitiva-auto.git
cd primitiva-auto
npm install
npx playwright install chromium
```

---

## Configuración

Copia el fichero de ejemplo y rellena tus credenciales:

```bash
cp .env.example .env
```

Edita `.env`:

```
PRIMITIVA_USUARIO=tu_email_o_dni
PRIMITIVA_PASSWORD=tu_contraseña
```

El fichero `.env` es local y nunca se sube al repositorio.

### Opciones adicionales

| Variable | Descripción |
|---|---|
| `PRIMITIVA_APUESTAS` | Número de apuestas fijo (1-8). Si no se define, el script lo pregunta. |
| `PRIMITIVA_CONFIRMAR_NUMEROS=si` | No pide confirmación de los números generados. |
| `PRIMITIVA_CONFIRMAR_PAGO=si` | No pide confirmación antes de pagar. **Úsalo con cuidado.** |

---

## Uso

```bash
# Modo normal
node primitiva-auto.js

# Especificar número de apuestas directamente (fuerza confirmaciones manuales)
node primitiva-auto.js 3
```

### Primera ejecución

La web usa protección anti-bots, así que el primer login es semi-manual:

1. El script abre el navegador y rellena tus credenciales automáticamente
2. Tú solo tienes que pulsar el botón **Entrar**
3. El script detecta que has entrado, guarda la sesión y continúa

A partir de ahí, las siguientes ejecuciones van directas al formulario sin pasar por el login.

---

## Bookmarklets de verificación

Dos scripts para comprobar tus aciertos directamente desde la página del resguardo de apuesta en [juegos.loteriasyapuestas.es](https://juegos.loteriasyapuestas.es).

### Cómo instalar un bookmarklet

1. Abre el archivo `.js` correspondiente (`verificar-primitiva.js` o `verificar-euromillones.js`)
2. Copia el bloque de código de la sección **VERSIÓN BOOKMARKLET** (la línea que empieza por `javascript:(function(){...`)
3. Crea un nuevo marcador en tu navegador y pégalo como URL

### Cómo usarlo

1. Entra en [juegos.loteriasyapuestas.es](https://juegos.loteriasyapuestas.es) con tu cuenta
2. Ve a tu historial de apuestas y abre el resguardo del boleto que quieras comprobar
3. Haz clic en el marcador

Aparecerá un panel con el desglose completo: por cada sorteo y cada apuesta, verás los números acertados resaltados y la categoría de premio obtenida (si la hay).

### `verificar-primitiva.js`

- Categorías: Reintegro, 5ª (3 ac.), 4ª (4 ac.), 3ª (5 ac.), 2ª (5+C), 1ª (6 ac.) y Especial (6+R)
- Resalta en amarillo los números acertados y en naranja el complementario

### `verificar-euromillones.js`

- 13 categorías: desde 13ª (2N) hasta 1ª (5N+2E)
- Resalta en amarillo los números acertados y en naranja las estrellas acertadas

---

## Notas

- Máximo 8 apuestas por ejecución (límite del formulario web).
- Si el saldo es insuficiente, el script avisa y cancela el pago automáticamente.
- La sesión guardada se invalida si cierras sesión desde otro navegador; en ese caso el script detectará el problema y pedirá login manual de nuevo.
