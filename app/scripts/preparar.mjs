// Prepara o projeto nativo a partir do site que está na raiz do repositório.
//   node scripts/preparar.mjs android   |   node scripts/preparar.mjs ios
// 1) copia o site para app/www  2) cria a pasta da plataforma se não existir
// 3) gera ícones e splash a partir de app/assets  4) sincroniza plugins
import { cpSync, existsSync, rmSync, readdirSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const plat = process.argv[2];
if (!["android", "ios"].includes(plat)) { console.error("uso: node scripts/preparar.mjs android|ios"); process.exit(1); }
const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAIZ = join(APP, "..");
const WWW = join(APP, "www");
const FORA = new Set(["app", ".github", ".git", "node_modules", ".vercel", "sw.js"]);
const run = cmd => { console.log("\n> " + cmd); execSync(cmd, { cwd: APP, stdio: "inherit" }); };

rmSync(WWW, { recursive: true, force: true }); mkdirSync(WWW);
for (const n of readdirSync(RAIZ)) {
  if (FORA.has(n) || n.startsWith(".") || /\.(md|txt)$/i.test(n) || n === "vercel.json") continue;
  cpSync(join(RAIZ, n), join(WWW, n), { recursive: true });
}
console.log("site copiado para app/www");

if (!existsSync(join(APP, plat))) run(`npx cap add ${plat}`);
const cor = "#0a0405";
try {
  run(`npx capacitor-assets generate --${plat} --iconBackgroundColor "${cor}" --iconBackgroundColorDark "${cor}" --splashBackgroundColor "${cor}" --splashBackgroundColorDark "${cor}"`);
} catch (e) { console.warn("aviso: não consegui gerar ícones/splash, o app usa os padrões do Capacitor"); }
run(`npx cap sync ${plat}`);
console.log(`\npronto. Para abrir no ${plat === "android" ? "Android Studio" : "Xcode"}: npm run abrir:${plat}`);
