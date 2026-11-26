/* StatNusa — data statistik Indonesia.
   Sumber: Badan Pusat Statistik (BPS) dan Bank Dunia. Setiap angka memakai
   tahun rujukan sendiri; angka 2025 yang bertanda proyeksi berasal dari
   proyeksi penduduk BPS. Nilai provinsi dibulatkan dari publikasi BPS 2024.
   Semua angka tersimpan lokal — situs ini tidak memanggil jaringan. */
window.STATNUSA = {
  meta: {
    country: "Indonesia",
    updated: "26 November 2026",
    currency: "Rupiah (Rp)",
    note: "Angka dibulatkan; selisih penjumlahan akibat pembulatan."
  },
  sources: [
    { name: "BPS — Statistik Indonesia 2025", year: 2025, url: "https://www.bps.go.id" },
    { name: "BPS — Berita Resmi Statistik: Pertumbuhan Ekonomi 2024", year: 2025, url: "https://www.bps.go.id" },
    { name: "BPS — Profil Kemiskinan Maret 2024 & Maret 2025", year: 2025, url: "https://www.bps.go.id" },
    { name: "BPS — Keadaan Ketenagakerjaan Agustus 2024", year: 2024, url: "https://www.bps.go.id" },
    { name: "BPS — Indeks Pembangunan Manusia 2024", year: 2025, url: "https://www.bps.go.id" },
    { name: "BPS — Proyeksi Penduduk Indonesia 2020–2050", year: 2023, url: "https://www.bps.go.id" },
    { name: "Bank Dunia — World Development Indicators: Indonesia", year: 2025, url: "https://data.worldbank.org/country/indonesia" }
  ],
  years: [2020, 2021, 2022, 2023, 2024, 2025],
  national: {
    /* penduduk dalam juta jiwa; 2025 = proyeksi BPS */
    population: [270.20, 272.68, 275.77, 278.69, 281.60, 284.44],
    populationNote: "2025 proyeksi",
    /* PDB harga berlaku, triliun rupiah */
    gdpNominal: [15434, 16976, 19588, 20892, 22139, null],
    /* pertumbuhan ekonomi y-on-y, persen */
    growth: [-2.07, 3.70, 5.31, 5.05, 5.03, null],
    /* inflasi y-on-y Desember, persen */
    inflation: [1.68, 1.87, 5.51, 2.61, 1.57, null],
    /* tingkat pengangguran terbuka, persen (Agustus) */
    unemployment: [7.07, 6.49, 5.86, 5.45, 4.76, null],
    /* penduduk miskin, persen (Maret) */
    poverty: [9.78, 9.71, 9.54, 9.36, 8.57, 8.47],
    /* Indeks Pembangunan Manusia */
    ipm: [71.94, 72.29, 72.91, 73.55, 74.39, null],
    gdpPerCapita2024: 78.6, /* juta rupiah */
    gdpPerCapitaUsd2024: 4960,
    gini2024: 0.379,
    povertyUrban2024: 7.44,
    povertyRural2024: 11.99,
    meanSchoolYears2024: 9.08,
    expectedSchoolYears2024: 13.34,
    literacy2024: 98.3
  },
  kpi: [
    { id: "pop", label: "Penduduk", value: "281,6 jt", sub: "2024 · +1,04% dari 2023", source: "BPS 2024" },
    { id: "gdp", label: "PDB Harga Berlaku", value: "Rp22.139 T", sub: "2024 · Rp78,6 jt per kapita", source: "BPS 2024" },
    { id: "growth", label: "Pertumbuhan Ekonomi", value: "5,03%", sub: "2024 · y-on-y", source: "BPS 2024" },
    { id: "infl", label: "Inflasi", value: "1,57%", sub: "2024 · y-on-y Desember", source: "BPS 2024" },
    { id: "unemp", label: "Pengangguran (TPT)", value: "4,76%", sub: "Agu 2024 · terendah sejak 2019", source: "BPS 2024" },
    { id: "pov", label: "Kemiskinan", value: "8,57%", sub: "Mar 2024 · 24,13 jt jiwa", source: "BPS 2024" }
  ],
  /* PDB menurut lapangan usaha, 2024, persen terhadap PDB */
  sectors: [
    { name: "Industri pengolahan", share: 18.67 },
    { name: "Perdagangan besar & eceran", share: 12.85 },
    { name: "Pertanian, kehutanan & perikanan", share: 11.91 },
    { name: "Konstruksi", share: 10.30 },
    { name: "Pertambangan & penggalian", share: 9.07 },
    { name: "Transportasi & pergudangan", share: 5.50 },
    { name: "Jasa keuangan & asuransi", share: 4.30 },
    { name: "Informasi & komunikasi", share: 4.20 },
    { name: "Real estat", share: 2.70 },
    { name: "Lapangan usaha lainnya", share: 20.50 }
  ],
  /* pertumbuhan ekonomi per kuartal, y-on-y persen */
  quarterly: [
    { q: "2023-Q1", v: 5.04 }, { q: "2023-Q2", v: 5.17 },
    { q: "2023-Q3", v: 4.94 }, { q: "2023-Q4", v: 5.04 },
    { q: "2024-Q1", v: 5.11 }, { q: "2024-Q2", v: 5.05 },
    { q: "2024-Q3", v: 4.95 }, { q: "2024-Q4", v: 5.02 },
    { q: "2025-Q1", v: 4.87 }, { q: "2025-Q2", v: 5.12 },
    { q: "2025-Q3", v: 5.04 }
  ],
  /* perdagangan luar negeri, miliar dolar AS */
  trade: [
    { year: 2020, export: 163.2, import: 141.6 },
    { year: 2021, export: 231.6, import: 196.2 },
    { year: 2022, export: 291.9, import: 237.5 },
    { year: 2023, export: 258.8, import: 221.9 },
    { year: 2024, export: 264.7, import: 233.7 }
  ],
  /* piramida penduduk 2024, juta jiwa per kelompok umur */
  pyramid: [
    { age: "0–4", m: 11.2, f: 10.7 }, { age: "5–9", m: 11.9, f: 11.4 },
    { age: "10–14", m: 12.1, f: 11.6 }, { age: "15–19", m: 11.8, f: 11.3 },
    { age: "20–24", m: 12.2, f: 11.7 }, { age: "25–29", m: 12.0, f: 11.5 },
    { age: "30–34", m: 11.6, f: 11.1 }, { age: "35–39", m: 11.2, f: 10.7 },
    { age: "40–44", m: 10.6, f: 10.1 }, { age: "45–49", m: 9.7, f: 9.2 },
    { age: "50–54", m: 8.5, f: 8.1 }, { age: "55–59", m: 7.1, f: 6.7 },
    { age: "60–64", m: 5.6, f: 5.3 }, { age: "65+", m: 7.9, f: 8.8 }
  ],
  education: {
    years: [2020, 2021, 2022, 2023, 2024],
    meanSchool: [8.72, 8.78, 8.89, 8.99, 9.08],
    expectedSchool: [12.98, 13.09, 13.10, 13.18, 13.34]
  },
  /* 34 provinsi, struktur BPS 2024. pop = juta jiwa; pdrb = PDRB per kapita
     juta rupiah; pov = kemiskinan % (Mar 2024); pov2020 = kemiskinan % (Mar 2020);
     unemp = TPT % (Agu 2024); ipm = IPM 2024; infl = inflasi % (Des 2024). */
  provinces: [
    { name: "Aceh", pop: 5.55, pdrb: 62.1, pov: 14.23, pov2020: 15.43, unemp: 5.75, ipm: 74.12, infl: 1.9 },
    { name: "Sumatera Utara", pop: 15.80, pdrb: 65.4, pov: 8.25, pov2020: 8.75, unemp: 5.66, ipm: 75.48, infl: 1.7 },
    { name: "Sumatera Barat", pop: 5.81, pdrb: 57.8, pov: 5.97, pov2020: 6.56, unemp: 5.60, ipm: 75.99, infl: 2.0 },
    { name: "Riau", pop: 6.85, pdrb: 147.9, pov: 6.75, pov2020: 7.05, unemp: 4.13, ipm: 74.84, infl: 2.2 },
    { name: "Jambi", pop: 3.68, pdrb: 73.8, pov: 7.58, pov2020: 8.20, unemp: 4.43, ipm: 73.99, infl: 1.8 },
    { name: "Sumatera Selatan", pop: 8.99, pdrb: 69.1, pov: 11.79, pov2020: 12.45, unemp: 4.10, ipm: 71.99, infl: 1.6 },
    { name: "Bengkulu", pop: 2.12, pdrb: 51.3, pov: 13.25, pov2020: 15.30, unemp: 3.61, ipm: 73.99, infl: 2.1 },
    { name: "Lampung", pop: 9.52, pdrb: 49.5, pov: 11.62, pov2020: 11.67, unemp: 4.03, ipm: 71.90, infl: 2.3 },
    { name: "Kep. Bangka Belitung", pop: 1.52, pdrb: 76.4, pov: 4.04, pov2020: 4.74, unemp: 4.60, ipm: 72.99, infl: 1.5 },
    { name: "Kep. Riau", pop: 2.19, pdrb: 156.3, pov: 6.01, pov2020: 5.78, unemp: 6.41, ipm: 77.87, infl: 1.4 },
    { name: "DKI Jakarta", pop: 10.68, pdrb: 322.9, pov: 4.14, pov2020: 4.53, unemp: 6.21, ipm: 82.46, infl: 1.8 },
    { name: "Jawa Barat", pop: 50.35, pdrb: 54.7, pov: 7.46, pov2020: 7.88, unemp: 6.91, ipm: 74.92, infl: 1.6 },
    { name: "Jawa Tengah", pop: 38.47, pdrb: 44.3, pov: 10.47, pov2020: 11.25, unemp: 5.36, ipm: 72.94, infl: 1.7 },
    { name: "DI Yogyakarta", pop: 3.76, pdrb: 46.5, pov: 10.81, pov2020: 11.46, unemp: 4.35, ipm: 80.78, infl: 2.0 },
    { name: "Jawa Timur", pop: 42.16, pdrb: 66.3, pov: 10.35, pov2020: 10.98, unemp: 4.19, ipm: 74.42, infl: 1.9 },
    { name: "Banten", pop: 12.62, pdrb: 62.5, pov: 6.17, pov2020: 5.92, unemp: 6.45, ipm: 75.03, infl: 1.8 },
    { name: "Bali", pop: 4.41, pdrb: 62.7, pov: 4.02, pov2020: 3.78, unemp: 2.04, ipm: 77.35, infl: 2.4 },
    { name: "Nusa Tenggara Barat", pop: 5.66, pdrb: 33.5, pov: 12.55, pov2020: 13.97, unemp: 2.71, ipm: 70.20, infl: 2.1 },
    { name: "Nusa Tenggara Timur", pop: 5.81, pdrb: 25.4, pov: 19.02, pov2020: 20.08, unemp: 3.12, ipm: 66.98, infl: 2.5 },
    { name: "Kalimantan Barat", pop: 5.82, pdrb: 50.2, pov: 6.95, pov2020: 7.05, unemp: 4.53, ipm: 70.60, infl: 2.0 },
    { name: "Kalimantan Tengah", pop: 2.83, pdrb: 68.9, pov: 5.16, pov2020: 5.05, unemp: 3.83, ipm: 72.93, infl: 1.9 },
    { name: "Kalimantan Selatan", pop: 4.26, pdrb: 61.2, pov: 4.38, pov2020: 4.61, unemp: 4.26, ipm: 73.77, infl: 1.7 },
    { name: "Kalimantan Timur", pop: 4.01, pdrb: 224.3, pov: 6.02, pov2020: 6.03, unemp: 5.06, ipm: 78.10, infl: 2.2 },
    { name: "Kalimantan Utara", pop: 0.74, pdrb: 159.8, pov: 6.78, pov2020: 6.55, unemp: 4.22, ipm: 73.78, infl: 2.0 },
    { name: "Sulawesi Utara", pop: 2.73, pdrb: 58.4, pov: 7.07, pov2020: 7.62, unemp: 6.10, ipm: 74.42, infl: 2.3 },
    { name: "Sulawesi Tengah", pop: 3.11, pdrb: 89.2, pov: 11.76, pov2020: 12.45, unemp: 3.00, ipm: 71.28, infl: 2.1 },
    { name: "Sulawesi Selatan", pop: 9.60, pdrb: 63.4, pov: 8.06, pov2020: 8.53, unemp: 4.50, ipm: 74.06, infl: 1.8 },
    { name: "Sulawesi Tenggara", pop: 2.83, pdrb: 63.3, pov: 10.67, pov2020: 10.97, unemp: 3.17, ipm: 73.13, infl: 2.4 },
    { name: "Gorontalo", pop: 1.25, pdrb: 43.2, pov: 14.84, pov2020: 15.85, unemp: 3.99, ipm: 69.83, infl: 2.2 },
    { name: "Sulawesi Barat", pop: 1.59, pdrb: 44.7, pov: 10.64, pov2020: 11.25, unemp: 2.81, ipm: 70.10, infl: 2.0 },
    { name: "Maluku", pop: 2.00, pdrb: 42.6, pov: 16.17, pov2020: 17.84, unemp: 6.18, ipm: 71.76, infl: 2.6 },
    { name: "Maluku Utara", pop: 1.41, pdrb: 58.5, pov: 6.03, pov2020: 6.62, unemp: 3.99, ipm: 70.93, infl: 2.4 },
    { name: "Papua Barat", pop: 1.28, pdrb: 80.5, pov: 20.24, pov2020: 20.76, unemp: 4.86, ipm: 67.02, infl: 2.8 },
    { name: "Papua", pop: 4.46, pdrb: 55.4, pov: 25.61, pov2020: 26.64, unemp: 3.17, ipm: 60.97, infl: 2.7 }
  ]
};
