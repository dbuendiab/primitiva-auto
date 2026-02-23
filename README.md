# primitiva-auto

Genera combinaciones aleatorias para **La Primitiva** y las rellena automáticamente en la web de [Loterías y Apuestas del Estado](https://juegos.loteriasyapuestas.es), lista para apostar con un solo comando.

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

## Notas

- Máximo 8 apuestas por ejecución (límite del formulario web).
- Si el saldo es insuficiente, el script avisa y cancela el pago automáticamente.
- La sesión guardada se invalida si cierras sesión desde otro navegador; en ese caso el script detectará el problema y pedirá login manual de nuevo.
