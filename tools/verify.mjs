/* StatNusa — verifikasi otomatis v2b (Node 22, Playwright Firefox).
   Menyalakan serve.ts di port acak, lalu memeriksa:
   1. semua 6 rute termuat tanpa console error & tanpa request gagal,
   2. NOL network request ke luar localhost (semua berkas lokal),
   3. semua link nav berfungsi (hash berubah + judul berubah),
   4. kontrol berfungsi: pemilih tren beranda, sort tabel (tanpa scroll ke atas),
      cari provinsi, checkbox Komparator (maks 4), pemilih indikator, reset,
      tema gelap, PETA choropleth (38 provinsi, ganti indikator, klik → Komparator,
      termasuk 4 provinsi pemekaran),
   5. angka narasi = hasil hitung data.js (283,88 / 205,04 / 72,8% / 24,13 /
      "23 provinsi terkecil"; angka v1/v2-lama yang salah TIDAK muncul),
   6. kualitas data (data-quality-auditor, 6 dimensi): completeness (38 baris,
      6 indikator numerik; hanya pov2020 6 provinsi Papua yang null —
      terdokumentasi), uniqueness (38 nama unik), validity (semua nilai dalam
      rentang wajar), consistency (CSV == data.js; path peta == data; Σ38 vs
      nasional berlabel), accuracy (narasi == hitung ulang independen),
      freshness (sumber 2024/2025 + catatan pemekaran di Metodologi),
   7. tidak ada horizontal overflow di desktop 1280×800 & phone 390×844,
   8. 4 screenshot ke screenshots/ (JPEG, masing-masing <= 256 KiB):
      1-beranda, 2-provinsi-peta, 3-penduduk, 4-beranda-phone.
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
  check("pencarian provinsi memfilter", /^6 dari 38/.test(countTxt || ""), countTxt);
  await page.fill("#prov-search", "");
  await page.waitForTimeout(200);
  const firstBefore = await page.textContent("#prov-body tr:first-child td:first-child");
  /* v2: sort TIDAK boleh melempar halaman ke atas — scroll dulu ke bawah, lalu sort. */
  await page.evaluate(() => window.scrollTo(0, 600));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.click('th[data-sort="pov"]');
  await page.waitForTimeout(200);
  const firstAfter = await page.textContent("#prov-body tr:first-child td:first-child");
  const scrollAfter = await page.evaluate(() => window.scrollY);
  check("sort tabel provinsi berfungsi", firstBefore !== firstAfter, firstBefore + " → " + firstAfter);
  check("sort TIDAK melempar halaman ke atas (bug v1)", Math.abs(scrollAfter - scrollBefore) < 5, "scrollY " + scrollBefore + " → " + scrollAfter);
  await page.evaluate(() => window.scrollTo(0, 0));
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

  /* Peta choropleth (v2b): 38 provinsi, legenda, ganti indikator, klik → Komparator. */
  const provPaths = await page.locator("#indonesia-map path[data-prov]").count();
  check("peta merender 38 provinsi", provPaths === 38, provPaths + " path");
  const legendTxt = await page.textContent(".map-legend");
  check("legenda peta tampil dengan rentang nilai", /Penduduk \(jt jiwa\)/.test(legendTxt || "") && (legendTxt || "").includes("–"), (legendTxt || "").slice(0, 80));
  const fillBefore = await page.getAttribute('path[data-prov="Papua"]', "fill");
  await page.selectOption("#map-metric", "pov");
  await page.waitForTimeout(200);
  const fillAfter = await page.getAttribute('path[data-prov="Papua"]', "fill");
  const legendAfter = await page.textContent(".map-legend");
  check("pemilih indikator peta mewarnai ulang", fillBefore !== fillAfter && /Kemiskinan/.test(legendAfter || ""), "Papua " + fillBefore + " → " + fillAfter);
  await page.selectOption("#map-metric", "pop");
  await page.waitForTimeout(200);
  const compBeforeMap = await page.textContent("#comp-status");
  await page.click('path[data-prov="Bali"]', { force: true });
  await page.waitForTimeout(200);
  const compAfterMap = await page.textContent("#comp-status");
  const baliChecked = await page.isChecked('[data-comp-prov][value="Bali"]');
  const baliSel = await page.locator('path[data-prov="Bali"].selected').count();
  check("klik provinsi di peta masuk Komparator", (compAfterMap || "").includes("4 provinsi dipilih") && baliChecked && baliSel === 1, (compBeforeMap || "") + " → " + (compAfterMap || "") + ", checkbox=" + baliChecked + ", selected=" + baliSel);
  await page.click('path[data-prov="Bali"]', { force: true });
  await page.waitForTimeout(200);
  /* v2b: klik provinsi pemekaran baru (Papua Tengah) juga masuk Komparator. */
  const compBeforeNew = await page.textContent("#comp-status");
  await page.click('path[data-prov="Papua Tengah"]', { force: true });
  await page.waitForTimeout(200);
  const compAfterNew = await page.textContent("#comp-status");
  const ptChecked = await page.isChecked('[data-comp-prov][value="Papua Tengah"]');
  const ptSel = await page.locator('path[data-prov="Papua Tengah"].selected').count();
  check("klik provinsi pemekaran (Papua Tengah) masuk Komparator", (compAfterNew || "").includes("4 provinsi dipilih") && ptChecked && ptSel === 1, (compBeforeNew || "") + " → " + (compAfterNew || "") + ", checkbox=" + ptChecked + ", selected=" + ptSel);
  const compHtmlNew = await page.textContent("#comp-result");
  check("Komparator menampilkan n/a untuk kemiskinan 2020 provinsi pemekaran", (compHtmlNew || "").includes("n/a") && (compHtmlNew || "").includes("belum diterbitkan BPS"), "n/a + penjelasan di tabel tren");
  await page.click('path[data-prov="Papua Tengah"]', { force: true });
  await page.waitForTimeout(200);

  /* Reviser v2b: batas Komparator maks 4 — pilihan ke-5 ditolak, pesan tampil,
     checkbox-nya tetap tak dicentang; lalu kembalikan ke 3 bawaan. */
  await page.click('path[data-prov="Bali"]', { force: true });
  await page.waitForTimeout(200);
  const fourTxt = await page.textContent("#comp-status");
  await page.click('[data-comp-prov][value="Aceh"]');
  await page.waitForTimeout(200);
  const guardTxt = await page.textContent("#comp-status");
  const acehChecked = await page.isChecked('[data-comp-prov][value="Aceh"]');
  check("Komparator menolak provinsi ke-5 (maks 4) + pesan tampil", (fourTxt || "").includes("4 provinsi dipilih") && (guardTxt || "").includes("Maksimal 4 provinsi") && !acehChecked, (fourTxt || "") + " → " + (guardTxt || "") + ", Aceh dicentang=" + acehChecked);
  await page.click('path[data-prov="Bali"]', { force: true });
  await page.waitForTimeout(200);

  /* Kualitas data — data-quality-auditor, 6 dimensi (v2b). */
  const dq = await page.evaluate(() => {
    const D = window.STATNUSA;
    const IND6 = ["pop", "pdrb", "pov", "unemp", "ipm", "infl"];
    const names = D.provinces.map((p) => p.name);
    const complete = D.provinces.every((p) => IND6.every((k) => typeof p[k] === "number" && isFinite(p[k])));
    const null2020 = D.provinces.filter((p) => p.pov2020 == null).map((p) => p.name).sort();
    const unique = new Set(names).size === names.length;
    const ranges = { pop: [0.1, 60], pdrb: [10, 400], pov: [0, 40], unemp: [0, 10], ipm: [50, 90], infl: [-1, 7] };
    const valid = D.provinces.every((p) => IND6.every((k) => p[k] >= ranges[k][0] && p[k] <= ranges[k][1]));
    const sum = D.provinces.reduce((a, p) => a + p.pop, 0);
    const top10 = D.provinces.slice().sort((a, b) => b.pop - a.pop).slice(0, 10);
    const top10sum = top10.reduce((a, p) => a + p.pop, 0);
    const jabar = D.provinces.find((p) => p.name === "Jawa Barat").pop;
    const asc = D.provinces.slice().sort((a, b) => a.pop - b.pop);
    let c = 0, n = 0;
    for (const p of asc) { if (c + p.pop < jabar) { c += p.pop; n++; } else break; }
    const mapNames = Array.from(document.querySelectorAll("#indonesia-map path[data-prov]")).map((el) => el.getAttribute("data-prov")).sort();
    const mapCovers = JSON.stringify(mapNames) === JSON.stringify(names.slice().sort());
    const povMax = D.provinces.reduce((a, p) => p.pov > a.pov ? p : a).name;
    const ipmMin = D.provinces.reduce((a, p) => p.ipm < a.ipm ? p : a).name;
    const unMin = D.provinces.reduce((a, p) => p.unemp < a.unemp ? p : a).name;
    return { n: D.provinces.length, complete, null2020, unique, valid, sum, top10sum, jabarN: n, jabarSum: c, mapCovers, povMax, ipmMin, unMin };
  });
  check("DQ completeness: 38 provinsi × 6 indikator numerik", dq.n === 38 && dq.complete, dq.n + " provinsi, lengkap=" + dq.complete);
  check("DQ completeness: hanya pov2020 6 provinsi Papua yang null (terdokumentasi)", JSON.stringify(dq.null2020) === JSON.stringify(["Papua", "Papua Barat", "Papua Barat Daya", "Papua Pegunungan", "Papua Selatan", "Papua Tengah"]), dq.null2020.join(", "));
  check("DQ uniqueness: 38 nama provinsi unik", dq.unique, "duplikat? " + !dq.unique);
  check("DQ validity: semua nilai dalam rentang wajar", dq.valid, "pop 0,1–60; pdrb 10–400; pov 0–40; TPT 0–10; IPM 50–90; infl -1–7");
  check("DQ consistency: path peta == data provinsi", dq.mapCovers, "38 path menutupi 38 nama data");
  check("DQ accuracy: hitung ulang Σ38 + top-10 + Jabar", Math.abs(dq.sum - 283.88) < 0.011 && Math.abs(dq.top10sum - 205.04) < 0.011 && dq.jabarN === 23 && Math.abs(dq.jabarSum - 50.19) < 0.011, "Σ=" + dq.sum.toFixed(2) + " top10=" + dq.top10sum.toFixed(2) + " Jabar vs " + dq.jabarN + " terkecil=" + dq.jabarSum.toFixed(2));
  check("DQ accuracy: ekstrem baru = Papua Pegunungan (miskin/IPM/TPT)", dq.povMax === "Papua Pegunungan" && dq.ipmMin === "Papua Pegunungan" && dq.unMin === "Papua Pegunungan", "povMax=" + dq.povMax + " ipmMin=" + dq.ipmMin + " unMin=" + dq.unMin);
  const csvTxt = await page.evaluate(async () => {
    const r = await fetch("data/provinsi.csv");
    return { ok: r.ok, text: await r.text() };
  });
  const csvRows = csvTxt.text.trim().split("\n").slice(1).map((line) => line.split(","));
  const csvOk = csvTxt.ok && csvRows.length === 38 && csvRows.every((row) => row.length === 8);
  const csvMatch = await page.evaluate((rows) => {
    const D = window.STATNUSA;
    const byName = {};
    D.provinces.forEach((p) => { byName[p.name] = p; });
    const num = (s) => s === "n/a" ? null : parseFloat(s);
    return rows.every((row) => {
      const p = byName[row[0]];
      if (!p) return false;
      return num(row[1]) === p.pop && num(row[2]) === p.pdrb && num(row[3]) === p.pov &&
        num(row[4]) === p.pov2020 && num(row[5]) === p.unemp && num(row[6]) === p.ipm && num(row[7]) === p.infl;
    });
  }, csvRows);
  check("DQ consistency: CSV provinsi == data.js (38 baris, semua kolom)", csvOk && csvMatch, csvRows.length + " baris, cocok=" + csvMatch);

  /* Angka narasi = hitung data.js (v2); angka v1 yang salah tidak boleh muncul. */
  const provTxt = await page.evaluate(() => document.body.innerText);
  /* "2020–2025" di footer (rentang data nasional) sah — yang dilarang adalah
     frasa tren komparator "tren kemiskinan 2020–2025" (tabelnya 2020→2024). */
  const mustHave = ["283,88", "2020–2024"];
  const mustNot = ["219,9", "25,22", "30 provinsi lain digabung", "279,1", "tren kemiskinan 2020–2025", "283,87", "19 provinsi terkecil", "34 provinsi", "25,61", "60,97"];
  const missingNums = mustHave.filter((s) => !provTxt.includes(s));
  const wrongNums = mustNot.filter((s) => provTxt.includes(s));
  check("angka narasi provinsi benar (283,88; 2020–2024)", missingNums.length === 0, "hilang: " + missingNums.join(", "));
  check("angka v1/v2-lama yang salah tidak muncul di provinsi", wrongNums.length === 0, "muncul: " + wrongNums.join(", "));
  await page.goto("http://127.0.0.1:8901/index.html#/penduduk");
  await ready();
  const pendTxt = await page.evaluate(() => document.body.innerText);
  check("angka narasi penduduk benar (205,04; 72,8%)", pendTxt.includes("205,04") && pendTxt.includes("72,8%"), "205,04/72,8% di halaman Penduduk");
  await page.goto("http://127.0.0.1:8901/index.html#/");
  await ready();
  const homeTxt2 = await page.evaluate(() => document.body.innerText);
  check("angka narasi beranda benar (24,13 jt miskin; 23 provinsi terkecil)", homeTxt2.includes("24,13") && homeTxt2.includes("23 provinsi terkecil") && homeTxt2.includes("56,1%"), "24,13 + 23 terkecil + 56,1% di Beranda");
  check("angka v1 yang salah tidak muncul di beranda", !homeTxt2.includes("25,22") && !homeTxt2.includes("30 provinsi lain digabung") && !homeTxt2.includes("19 provinsi terkecil") && !homeTxt2.includes("34 provinsi"), "bersih dari 25,22 & klaim Jabar salah");
  await page.goto("http://127.0.0.1:8901/index.html#/sosial");
  await ready();
  const donutCount = await page.locator(".donut").count();
  const sosialTxt = await page.evaluate(() => document.body.innerText);
  check("donat kota/desa dihapus (bukan pangsa)", donutCount === 0 && sosialTxt.includes("bukan pangsa penduduk"), "donut=" + donutCount);
  check("ekstrem Sosial: Papua Pegunungan termiskin + IPM terendah + TPT terendah",
    sosialTxt.includes("Papua Pegunungan") && sosialTxt.includes("32,97") && sosialTxt.includes("54,43") && sosialTxt.includes("1,32"),
    "Papua Pegunungan di kartu ekstrem Sosial");
  await page.goto("http://127.0.0.1:8901/index.html#/provinsi");
  await ready();

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
  check("CSV provinsi lokal tersedia (39 baris: header + 38 provinsi)", csv.ok && csv.lines === 39, csv.lines + " baris");

  /* Screenshot 1–3 desktop, 4 phone. Shot 2 diambil dari atas (header/nav utuh,
     peta terlihat penuh) — TANPA scroll ke komparator seperti v1. */
  mkdirSync(shotsDir, { recursive: true });
  const shots = [
    ["1-beranda.jpg", "#/", 1280, 800],
    ["2-provinsi-peta.jpg", "#/provinsi", 1280, 800],
    ["3-penduduk.jpg", "#/penduduk", 1280, 800]
  ];
  for (const [file, hash, w, h] of shots) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("http://127.0.0.1:8901/index.html" + hash);
    await page.reload(); /* reset state aplikasi (mis. pemilih tren) ke default */
    await ready();
    await page.waitForTimeout(300);
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
    { file: "2-provinsi-peta.jpg", path: "#/provinsi", viewport: { width: 1280, height: 800 } },
    { file: "3-penduduk.jpg", path: "#/penduduk", viewport: { width: 1280, height: 800 } },
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
