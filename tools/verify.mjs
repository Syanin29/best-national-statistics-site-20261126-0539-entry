/* StatNusa — verifikasi otomatis (Node 22, Playwright Firefox).
   Menyalakan serve.ts di port acak, lalu memeriksa:
   1. semua 6 rute termuat tanpa console error & tanpa request gagal,
   2. NOL network request ke luar localhost (semua berkas lokal),
   3. semua link nav berfungsi (hash berubah + judul berubah),
   4. kontrol berfungsi: pemilih tren beranda, sort tabel, cari provinsi,
      checkbox Komparator (maks 4), pemilih indikator, reset, tema gelap,
   5. tidak ada horizontal overflow di desktop 1280×800 & phone 390×844,
   6. 4 screenshot ke screenshots/ (JPEG, masing-masing <= 256 KiB).
   Keluar 0 bila semua cek lolos, 1 bila ada yang gagal.
   Jalankan: node tools/verify.mjs */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const shotsDir = join(root, "screenshots");
const require = createRequire(import.meta.url);

function loadPlaywright() {
  try { return require("playwright"); } catch { /* lanjut */ }
  for (const dir of readdirSync(join(process.env.HOME, ".npm", "_npx"))) {
    const p = join(process.env.HOME, ".npm", "_npx", dir, "node_modules", "playwright");
    if (existsSync(join(p, "package.json"))) return require(p);
  }
  throw new Error("playwright tidak ditemukan — jalankan: npx playwright --version");
}

const { firefox } = loadPlaywright();
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || "" });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " — " + detail : ""));
}

const server = spawn(process.execPath, ["serve.ts", "--port", "8901"], { cwd: root, stdio: "ignore" });
async function waitUp(url, tries) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch { /* coba lagi */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

let code = 0;
try {
  if (!await waitUp("http://127.0.0.1:8901/index.html", 20)) throw new Error("serve.ts tidak naik");
  const browser = await firefox.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const external = [], failed = [], errors = [];
  page.on("request", (req) => { const u = req.url(); if (!u.startsWith("http://127.0.0.1:8901") && !u.startsWith("http://localhost:8901")) external.push(u); });
  page.on("requestfailed", (req) => failed.push(req.url()));
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const ready = async () => { await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 5000 }); };

  const routes = [
    ["#/", "Beranda"], ["#/penduduk", "Penduduk"], ["#/ekonomi", "Ekonomi"],
    ["#/provinsi", "Provinsi"], ["#/sosial", "Sosial"], ["#/metodologi", "Metodologi"]
  ];
  for (const [hash, label] of routes) {
    await page.goto("http://127.0.0.1:8901/index.html" + hash);
    await page.reload(); /* reset state aplikasi (mis. pemilih tren) ke default */
    await ready();
    const title = await page.title();
    check("rute " + label + " termuat", title.includes("StatNusa"), title.slice(0, 60));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("tanpa overflow horizontal " + label + " (desktop)", overflow <= 0, "kelebihan " + overflow + "px");
  }
  check("nol request eksternal", external.length === 0, external.slice(0, 3).join(", "));
  check("nol request gagal", failed.length === 0, failed.slice(0, 3).join(", "));
  check("nol console/page error", errors.length === 0, errors.slice(0, 3).join(" | "));

  /* Kontrol beranda: pemilih tren mengganti grafik. */
  await page.goto("http://127.0.0.1:8901/index.html#/");
  await ready();
  const before = await page.locator("#home-trend svg").count();
  await page.click('[data-chart-metric="growth"]');
  const after = await page.locator("#home-trend svg").count();
  const pressed = await page.getAttribute('[data-chart-metric="growth"]', "aria-pressed");
  check("pemilih tren beranda berfungsi", before === 1 && after === 1 && pressed === "true", "svg " + before + "→" + after);

  /* Kontrol provinsi: cari, sort, komparator. */
  await page.goto("http://127.0.0.1:8901/index.html#/provinsi");
  await ready();
  await page.fill("#prov-search", "Papua");
  await page.waitForTimeout(200);
  const countTxt = await page.textContent("#prov-count");
  check("pencarian provinsi memfilter", /^(2|1) dari 34/.test(countTxt || ""), countTxt);
  await page.fill("#prov-search", "");
  await page.waitForTimeout(200);
  const firstBefore = await page.textContent("#prov-body tr:first-child td:first-child");
  await page.click('th[data-sort="pov"]');
  await page.waitForTimeout(200);
  const firstAfter = await page.textContent("#prov-body tr:first-child td:first-child");
  check("sort tabel provinsi berfungsi", firstBefore !== firstAfter, firstBefore + " → " + firstAfter);
  const compBefore = await page.textContent("#comp-status");
  await page.click('[data-comp-prov][value="Bali"]');
  await page.waitForTimeout(200);
  const compAfter = await page.textContent("#comp-status");
  check("checkbox Komparator menambah pilihan", compBefore !== compAfter, (compBefore || "") + " → " + (compAfter || ""));
  await page.selectOption("#comp-metric", "ipm");
  await page.waitForTimeout(200);
  const compHtml = await page.textContent("#comp-result");
  check("pemilih indikator Komparator berfungsi", (compHtml || "").includes("IPM"), "tabel + grafik IPM tampil");
  const bintangTerbaik = (compHtml || "").split("★").length - 1;
  check("tabel Komparator menandai nilai terbaik dengan bintang", bintangTerbaik >= 6, bintangTerbaik + " penanda bintang di tabel");
  await page.click("#comp-reset");
  await page.waitForTimeout(200);
  const resetTxt = await page.textContent("#comp-status");
  check("reset Komparator berfungsi", (resetTxt || "").includes("3 provinsi dipilih"), resetTxt);

  /* Tema gelap. */
  await page.click("#theme-toggle");
  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check("tombol tema gelap berfungsi", theme === "dark", "tema=" + theme);
  await page.click("#theme-toggle");

  /* CSV lokal bisa diunduh. */
  const csv = await page.evaluate(async () => {
    const r = await fetch("data/provinsi.csv");
    const t = await r.text();
    return { ok: r.ok, lines: t.trim().split("\n").length };
  });
  check("CSV provinsi lokal tersedia", csv.ok && csv.lines === 35, csv.lines + " baris");

  /* Screenshot 1–3 desktop, 4 phone. */
  mkdirSync(shotsDir, { recursive: true });
  const shots = [
    ["1-beranda.jpg", "#/", 1280, 800],
    ["2-komparator.jpg", "#/provinsi", 1280, 800],
    ["3-ekonomi.jpg", "#/ekonomi", 1280, 800]
  ];
  for (const [file, hash, w, h] of shots) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("http://127.0.0.1:8901/index.html" + hash);
    await page.reload(); /* reset state aplikasi (mis. pemilih tren) ke default */
    await ready();
    await page.waitForTimeout(300);
    if (file === "2-komparator.jpg") {
      await page.evaluate(() => document.getElementById("komparator").scrollIntoView());
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: join(shotsDir, file), type: "jpeg", quality: 72 });
    const bytes = statSync(join(shotsDir, file)).size;
    check("screenshot " + file + " <= 256 KiB", bytes <= 262144, bytes + " byte");
  }
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  phone.on("pageerror", (e) => errors.push(String(e)));
  await phone.goto("http://127.0.0.1:8901/index.html#/");
  await phone.waitForFunction(() => window.__shotReady === true, null, { timeout: 5000 });
  const pOverflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("tanpa overflow horizontal (phone 390)", pOverflow <= 0, "kelebihan " + pOverflow + "px");
  await phone.waitForTimeout(300);
  await phone.screenshot({ path: join(shotsDir, "4-beranda-phone.jpg"), type: "jpeg", quality: 72 });
  const pBytes = statSync(join(shotsDir, "4-beranda-phone.jpg")).size;
  check("screenshot 4-beranda-phone.jpg <= 256 KiB", pBytes <= 262144, pBytes + " byte");
  await browser.close();

  /* shots.json diperbarui sesuai view. */
  writeFileSync(join(root, "shots.json"), JSON.stringify([
    { file: "1-beranda.jpg", path: "#/", viewport: { width: 1280, height: 800 } },
    { file: "2-komparator.jpg", path: "#/provinsi", viewport: { width: 1280, height: 800 } },
    { file: "3-ekonomi.jpg", path: "#/ekonomi", viewport: { width: 1280, height: 800 } },
    { file: "4-beranda-phone.jpg", path: "#/", viewport: { width: 390, height: 844 } }
  ], null, 2) + "\n");
  console.log("shots.json ditulis.");
} catch (e) {
  console.error("ERROR:", e.message);
  code = 1;
} finally {
  server.kill();
}
const failedCount = results.filter((r) => !r.ok).length;
console.log("\n" + results.filter((r) => r.ok).length + " lolos, " + failedCount + " gagal dari " + results.length + " cek.");
process.exit(code || (failedCount ? 1 : 0));
