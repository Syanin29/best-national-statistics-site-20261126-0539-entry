# StatNusa — Portal Statistik Indonesia (v1)

**Judul submit:** "StatNusa — Statistik Indonesia 2025: 281,6 Juta Penduduk, 34 Provinsi, 6 Tahun Tren dalam Satu Portal"

Portal statistik satu negara (Indonesia) dengan data nyata BPS & Bank Dunia, 2020–2025.
Sistem unik: **Komparator 34 Provinsi** — pilih 2–4 provinsi, bandingkan 6 indikator
(penduduk, PDRB per kapita, kemiskinan, pengangguran, IPM, inflasi) + tren kemiskinan 2020–2024.

## Section (semua via link, semua kontrol berfungsi)

1. **Beranda** — 6 KPI cards + grafik tren nasional dengan pemilih indikator.
2. **Penduduk & Demografi** — tren 2020–2025, piramida penduduk 2024, 10 provinsi terbesar.
3. **Ekonomi** — PDB per sektor, pertumbuhan per kuartal, ekspor vs impor + neraca.
4. **Provinsi** — tabel 34 provinsi (sortable + pencarian) + Komparator multi-provinsi.
5. **Sosial** — kemiskinan, pengangguran, IPM, pendidikan, kota vs desa, provinsi ekstrem.
6. **Metodologi & Sumber** — sumber + tahun tiap angka, definisi, unduh CSV lokal.

## Teknologi

- `app/` statis, tanpa build step, tanpa network request (semua file lokal).
- Grafik digambar sendiri (SVG) di `app/charts.js` — tanpa library chart eksternal.
- Tema terang/gelap tersimpan lokal; responsif (desktop 1280×800 & phone 390×844).

## Jalankan

```sh
node serve.ts        # http://localhost:8080
node tools/verify.mjs   # serve + screenshot + cek link/kontrol/network/overflow
MAKEFUN_OUTPUT_DIR=out node main.ts   # tulis dossier.json
```

## Data

BPS (Statistik Indonesia 2025, BRS Pertumbuhan Ekonomi, Profil Kemiskinan, Keadaan
Ketenagakerjaan, IPM, Proyeksi Penduduk) dan Bank Dunia WDI. Berkas mentah:
`app/data/nasional.csv`, `app/data/provinsi.csv`, `app/data/ekonomi.csv`.
Struktur 34 provinsi mengikuti publikasi BPS 2024 agar deret 2020–2024 sebanding.

## Changelog

- **v1** — build awal: 6 section, Komparator 34 Provinsi, grafik SVG tulisan sendiri,
  CSV lokal, tools/ verifikasi + screenshot Playwright Firefox.
