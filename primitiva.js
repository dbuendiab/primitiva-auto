const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("¿Cuántas apuestas quieres? ", (respuesta) => {
  const apuestas = parseInt(respuesta);

  console.log("--- La Primitiva ---");
  for (let i = 1; i <= apuestas; i++) {
    const numeros = sortear(6, 1, 49);
    console.log(`Apuesta ${i}: `, numeros.map((n) => String(n).padStart(2, "0")).join(" - "));
  }

  const reintegro = Math.floor(Math.random() * 10);
  console.log(`\nReintegro: ${reintegro}`);

  rl.close();
});

function sortear(cantidad, min, max) {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, cantidad).sort((a, b) => a - b);
}
