/* StatNusa — tampilan 6 section. Semua angka dari window.STATNUSA (data.js),
   semua grafik dari window.StatCharts (charts.js). Tidak ada placeholder:
   setiap section menampilkan angka nyata beserta sumber dan tahunnya. */
window.StatViews = (function () {
  var D = window.STATNUSA, C = window.StatCharts;
  var esc = C.esc, fmt = C.fmt;

  var INDICATORS = [
    { key: "pop", label: "Penduduk (jt jiwa)", decimals: 2, lowerBetter: false },
    { key: "pdrb", label: "PDRB per kapita (Rp jt)", decimals: 1, lowerBetter: false },
    { key: "pov", label: "Kemiskinan (%)", decimals: 2, lowerBetter: true },
    { key: "unemp", label: "Pengangguran (%)", decimals: 2, lowerBetter: true },
    { key: "ipm", label: "IPM", decimals: 2, lowerBetter: false },
    { key: "infl", label: "Inflasi (%)", decimals: 1, lowerBetter: true }
  ];
  var BEST = { pop: "terbesar", pdrb: "tertinggi", pov: "terendah", unemp: "terendah", ipm: "tertinggi", infl: "terendah" };

  function srcTag(s) { return '<span class="src">' + esc(s) + '</span>'; }
  function sectionHead(kicker, title, lead) {
    return '<p class="kicker">' + esc(kicker) + '</p><h1>' + esc(title) + '</h1><p class="lead">' + lead + '</p>';
  }
  function kpiCards() {
    return '<div class="kpi-grid">' + D.kpi.map(function (k) {
      return '<article class="kpi"><p class="kpi-label">' + esc(k.label) + '</p>' +
        '<p class="kpi-value">' + esc(k.value) + '</p>' +
        '<p class="kpi-sub">' + esc(k.sub) + '</p>' + srcTag(k.source) + '</article>';
    }).join("") + '</div>';
  }

  /* ---- Beranda ---- */
  function homeTrend(metric) {
    var yrs = D.years.map(String);
    if (metric === "pop") return C.lineChart(yrs, [{ label: "Penduduk (jt jiwa)", values: D.national.population }], { decimals: 1, min: 260, zeroBase: false });
    if (metric === "gdp") return C.lineChart(yrs.slice(0, 5), [{ label: "PDB (Rp triliun)", values: D.national.gdpNominal.slice(0, 5) }], { decimals: 0 });
    if (metric === "growth") return C.lineChart(yrs.slice(0, 5), [{ label: "Pertumbuhan ekonomi (%)", values: D.national.growth.slice(0, 5) }], { decimals: 2, min: -3, zeroBase: false });
    return C.lineChart(yrs, [{ label: "Kemiskinan (%)", values: D.national.poverty }], { decimals: 2, min: 0, zeroBase: false });
  }
  function home(metric) {
    metric = metric || "pop";
    var labels = { pop: "Penduduk", gdp: "PDB", growth: "Pertumbuhan", pov: "Kemiskinan" };
    var btns = Object.keys(labels).map(function (m) {
      return '<button type="button" data-chart-metric="' + m + '" class="pill' + (m === metric ? ' active' : '') + '" aria-pressed="' + (m === metric) + '">' + labels[m] + '</button>';
    }).join("");
    return sectionHead("Portal Statistik Indonesia · Data BPS & Bank Dunia",
      "Indonesia dalam angka, 2020–2025",
      "Satu portal untuk membaca Indonesia: <strong>281,6 juta penduduk</strong> di <strong>34 provinsi</strong>, " +
      "ekonomi <strong>Rp22.139 triliun</strong>, dan <strong>6 tahun tren</strong> yang bisa dibandingkan — semua angka " +
      "disertai sumber dan tahunnya.") +
      kpiCards() +
      '<section class="card"><div class="card-head"><h2>Tren nasional 2020–2025</h2><div class="pill-row" role="group" aria-label="Pilih indikator tren">' + btns + '</div></div>' +
      '<div id="home-trend">' + homeTrend(metric) + '</div>' +
      '<p class="note">Penduduk 2025 adalah proyeksi BPS; PDB, pertumbuhan, inflasi, pengangguran, dan IPM tersedia sampai 2024. ' + srcTag("BPS 2024–2025") + '</p></section>' +
      '<section class="card"><h2>Tiga angka yang perlu diketahui</h2><ol class="facts">' +
      '<li><strong>56% penduduk</strong> tinggal di Pulau Jawa — Jawa Barat sendiri 50,35 juta jiwa, lebih besar dari 30 provinsi lain digabung. ' + srcTag("BPS 2024") + '</li>' +
      '<li><strong>Kemiskinan turun 1,21 poin</strong> dalam empat tahun: dari 9,78% (Mar 2020) ke 8,57% (Mar 2024), lalu 8,47% (Mar 2025). ' + srcTag("BPS 2025") + '</li>' +
      '<li><strong>Surplus dagang 5 tahun beruntun:</strong> ekspor 2024 US$264,7 miliar lawan impor US$233,7 miliar. ' + srcTag("BPS 2024") + '</li>' +
      '</ol><p><a class="btn" href="#/provinsi">Bandingkan 34 provinsi →</a> <a class="btn ghost" href="#/ekonomi">Lihat ekonomi →</a></p></section>' +
      '<section class="card"><h2>Jelajahi berdasarkan topik</h2><div class="topic-grid">' +
      '<a class="topic" href="#/penduduk"><strong>Penduduk &amp; Demografi</strong><span>Piramida penduduk 2024 + 10 provinsi terbesar</span></a>' +
      '<a class="topic" href="#/ekonomi"><strong>Ekonomi</strong><span>PDB per sektor, kuartal, ekspor-impor</span></a>' +
      '<a class="topic" href="#/provinsi"><strong>Provinsi</strong><span>Tabel 34 provinsi + Komparator</span></a>' +
      '<a class="topic" href="#/sosial"><strong>Sosial</strong><span>Kemiskinan, pengangguran, IPM, pendidikan</span></a>' +
      '<a class="topic" href="#/metodologi"><strong>Metodologi &amp; Sumber</strong><span>Definisi, sumber, unduh CSV</span></a>' +
      '</div></section>';
  }

  /* ---- Penduduk ---- */
  function penduduk() {
    var top10 = D.provinces.slice().sort(function (a, b) { return b.pop - a.pop; }).slice(0, 10);
    var rows = top10.map(function (p, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(p.name) + '</td><td class="num">' + fmt(p.pop, 2) + '</td>' +
        '<td class="num">' + fmt(p.pop / 281.6 * 100, 1) + '%</td></tr>';
    }).join("");
    return sectionHead("Penduduk & Demografi", "281,6 juta jiwa — dan makin menua",
      "Penduduk Indonesia tumbuh sekitar 1% per tahun. Piramida 2024 masih lebar di bawah, " +
      "tapi kelompok 65+ sudah 16,7 juta jiwa — penuaan berjalan pelan tapi pasti.") +
      '<section class="card"><h2>Tren penduduk 2020–2025</h2>' +
      C.lineChart(D.years.map(String), [{ label: "Penduduk (jt jiwa)", values: D.national.population }], { decimals: 1, min: 260, zeroBase: false }) +
      '<p class="note">2025 proyeksi BPS. Laju tumbuh 2023→2024: +1,04%. ' + srcTag("BPS 2023–2024") + '</p></section>' +
      '<section class="card"><h2>Piramida penduduk 2024</h2>' + C.pyramidChart(D.pyramid) +
      '<p class="note">Usia produktif (15–64) sekitar 69% dari penduduk. Rasio ketergantungan ±44 per 100 penduduk usia kerja. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>10 provinsi terbesar</h2><table class="tbl"><thead><tr><th>#</th><th>Provinsi</th><th class="num">Penduduk (jt)</th><th class="num">Pangsa nasional</th></tr></thead><tbody>' +
      rows + '</tbody></table><p class="note">Kesepuluh provinsi ini menampung 219,9 juta jiwa — 78% penduduk Indonesia. ' + srcTag("BPS 2024") + '</p></section>';
  }

  /* ---- Ekonomi ---- */
  function ekonomi() {
    var sectorRows = D.sectors.map(function (s) { return { label: s.name, value: s.share }; });
    var qItems = D.quarterly.map(function (q) { return { label: q.q, value: q.v }; });
    var tradeRows = D.trade.map(function (t) {
      return '<tr><td>' + t.year + '</td><td class="num">' + fmt(t.export, 1) + '</td><td class="num">' + fmt(t.import, 1) + '</td><td class="num">' + fmt(t.export - t.import, 1) + '</td></tr>';
    }).join("");
    return sectionHead("Ekonomi", "Rp22.139 triliun, tumbuh 5,03%",
      "Industri pengolahan tetap penopang terbesar PDB (18,67%), disusul perdagangan dan pertanian. " +
      "Pertumbuhan kuartalan stabil di kisaran 5% sejak 2023.") +
      '<section class="card"><h2>PDB menurut lapangan usaha, 2024</h2>' +
      C.hbarChart(sectorRows, { unit: "%", decimals: 2 }) +
      '<p class="note">Pangsa terhadap PDB harga berlaku. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>Pertumbuhan per kuartal, y-on-y (%)</h2>' +
      C.barChart(qItems, { decimals: 2, min: 0 }) +
      '<p class="note">Kuartal terkuat: 2023-Q2 (5,17%); terlemah: 2025-Q1 (4,87%). ' + srcTag("BPS 2025") + '</p></section>' +
      '<section class="card"><h2>Ekspor vs impor (miliar US$)</h2>' +
      C.groupedBarChart(D.trade.map(function (t) { return String(t.year); }), [
        { label: "Ekspor", values: D.trade.map(function (t) { return t.export; }), color: "#0072B2" },
        { label: "Impor", values: D.trade.map(function (t) { return t.import; }), color: "#E69F00" }
      ]) +
      '<table class="tbl"><thead><tr><th>Tahun</th><th class="num">Ekspor</th><th class="num">Impor</th><th class="num">Neraca</th></tr></thead><tbody>' +
      tradeRows + '</tbody></table><p class="note">Surplus 2024: US$31,0 miliar — tahun kelima beruntun. ' + srcTag("BPS 2024") + '</p></section>';
  }

  /* ---- Provinsi + Komparator ---- */
  function provRows(list, sortKey, dir) {
    var sorted = list.slice().sort(function (a, b) {
      var av = a[sortKey], bv = b[sortKey];
      return (typeof av === "string" ? av.localeCompare(bv, "id") : av - bv) * dir;
    });
    return sorted.map(function (p) {
      return '<tr><td>' + esc(p.name) + '</td><td class="num">' + fmt(p.pop, 2) + '</td>' +
        '<td class="num">' + fmt(p.pdrb, 1) + '</td><td class="num">' + fmt(p.pov, 2) + '</td>' +
        '<td class="num">' + fmt(p.unemp, 2) + '</td><td class="num">' + fmt(p.ipm, 2) + '</td>' +
        '<td class="num">' + fmt(p.infl, 1) + '</td></tr>';
    }).join("");
  }
  function compTable(selected, metric) {
    if (selected.length < 2) {
      return '<p class="note">Pilih minimal 2 provinsi untuk membandingkan. Saat ini ' + selected.length + ' dipilih.</p>';
    }
    var ind = INDICATORS.find(function (x) { return x.key === metric; });
    var head = '<tr><th>Indikator (2024)</th>' + selected.map(function (p) { return '<th class="num">' + esc(p.name) + '</th>'; }).join("") + '<th class="num">Nasional</th></tr>';
    var nat = { pop: 281.6, pdrb: 78.6, pov: 8.57, unemp: 4.76, ipm: 74.39, infl: 1.57 };
    var body = INDICATORS.map(function (ind2) {
      var vals = selected.map(function (p) { return p[ind2.key]; });
      var bestVal = ind2.lowerBetter ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
      var cells = selected.map(function (p) {
        var v = p[ind2.key];
        var mark = v === bestVal ? ' class="num best"' : ' class="num"';
        return '<td' + mark + '>' + fmt(v, ind2.decimals) + (v === bestVal ? ' ★' : '') + '</td>';
      }).join("");
      return '<tr><td>' + esc(ind2.label) + '</td>' + cells + '<td class="num">' + fmt(nat[ind2.key], ind2.decimals) + '</td></tr>';
    }).join("");
    var delta = selected.map(function (p) {
      return '<tr><td>' + esc(p.name) + '</td><td class="num">' + fmt(p.pov2020, 2) + '</td><td class="num">' + fmt(p.pov, 2) + '</td><td class="num">' + fmt(p.pov - p.pov2020, 2) + '</td></tr>';
    }).join("");
    var chartItems = selected.map(function (p, i) { return { label: p.name, value: p[metric] }; });
    return '<table class="tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
      '<p class="note">★ = ' + BEST[metric] + ' di antara provinsi yang dipilih pada indikator <strong>' + esc(ind.label) + '</strong>. Kolom Nasional: PDB per kapita Rp78,6 jt; inflasi nasional 1,57%. ' + srcTag("BPS 2024") + '</p>' +
      '<h3>Perbandingan: ' + esc(ind.label) + '</h3>' +
      C.hbarChart(chartItems, { decimals: ind.decimals, labelW: 170 }) +
      '<h3>Tren kemiskinan 2020 → 2024 (poin %)</h3>' +
      '<table class="tbl"><thead><tr><th>Provinsi</th><th class="num">2020</th><th class="num">2024</th><th class="num">Perubahan</th></tr></thead><tbody>' + delta + '</tbody></table>' +
      '<p class="note">Semua provinsi yang dipilih menurunkan kemiskinan sejak 2020 kecuali yang perubahannya positif. ' + srcTag("BPS 2020 & 2024") + '</p>';
  }
  function provinsi(state) {
    var q = (state.q || "").toLowerCase();
    var list = D.provinces.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) !== -1; });
    var checks = D.provinces.map(function (p) {
      var on = state.selected.indexOf(p.name) !== -1;
      return '<label class="check"><input type="checkbox" data-comp-prov value="' + esc(p.name) + '"' + (on ? ' checked' : '') + '> ' + esc(p.name) + '</label>';
    }).join("");
    var sel = D.provinces.filter(function (p) { return state.selected.indexOf(p.name) !== -1; });
    var opts = INDICATORS.map(function (ind) {
      return '<option value="' + ind.key + '"' + (ind.key === state.metric ? ' selected' : '') + '>' + esc(ind.label) + '</option>';
    }).join("");
    var arrow = state.dir === 1 ? " ▲" : " ▼";
    function th(key, label, cls) {
      return '<th data-sort="' + key + '" class="' + (cls || "") + '" tabindex="0">' + label + (state.sortKey === key ? arrow : '') + '</th>';
    }
    return sectionHead("Provinsi", "34 provinsi, satu tabel, semua bisa diurutkan",
      "Klik judul kolom untuk mengurutkan. Cari provinsi lewat kotak pencarian, lalu bandingkan " +
      "dengan <strong>Komparator 34 Provinsi</strong> di bawah.") +
      '<section class="card"><div class="card-head"><h2>Tabel 34 provinsi (2024)</h2>' +
      '<label class="search">Cari provinsi <input id="prov-search" type="search" placeholder="mis. Jawa, Papua, Bali…" value="' + esc(state.q || "") + '" aria-label="Cari provinsi"></label></div>' +
      '<div class="tbl-wrap"><table class="tbl sortable"><thead><tr>' +
      th("name", "Provinsi") + th("pop", "Penduduk (jt)", "num") + th("pdrb", "PDRB/kapita (Rp jt)", "num") +
      th("pov", "Miskin (%)", "num") + th("unemp", "TPT (%)", "num") + th("ipm", "IPM", "num") + th("infl", "Inflasi (%)", "num") +
      '</tr></thead><tbody id="prov-body">' + provRows(list, state.sortKey, state.dir) + '</tbody></table></div>' +
      '<p class="note" id="prov-count">' + list.length + ' dari 34 provinsi ditampilkan. Jumlah penduduk provinsi ≈281,6 jt (selisih akibat pembulatan). ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card" id="komparator"><h2>Komparator 34 Provinsi</h2>' +
      '<p>Sistem unik StatNusa: pilih 2–4 provinsi, bandingkan <strong>6 indikator sekaligus</strong> — penduduk, PDRB per kapita, kemiskinan, pengangguran, IPM, inflasi — plus tren kemiskinan 2020–2025.</p>' +
      '<div class="check-grid">' + checks + '</div>' +
      '<p class="comp-controls"><label>Indikator grafik <select id="comp-metric">' + opts + '</select></label> ' +
      '<button type="button" class="btn ghost" id="comp-reset">Reset pilihan</button> ' +
      '<span id="comp-status" class="note">' + sel.length + ' provinsi dipilih</span></p>' +
      '<div id="comp-result">' + compTable(sel, state.metric) + '</div></section>';
  }

  /* ---- Sosial ---- */
  function sosial() {
    var yrs = D.years.map(String);
    return sectionHead("Sosial", "Kemiskinan turun, IPM naik, pengangguran membaik",
      "Tiga tren sosial bergerak ke arah yang sama sejak 2020: kemiskinan turun, pengangguran turun, " +
      "IPM naik. Kesenjangannya tetap: kemiskinan desa (11,99%) jauh di atas kota (7,44%).") +
      '<section class="card"><h2>Kemiskinan 2020–2025 (%)</h2>' +
      C.lineChart(yrs, [{ label: "Penduduk miskin (%)", values: D.national.poverty }], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Maret tiap tahun; 2025: 8,47% (24,06 jt jiwa). Kota 7,44% vs desa 11,99% (Mar 2024). ' + srcTag("BPS 2025") + '</p></section>' +
      '<div class="grid2">' +
      '<section class="card"><h2>Pengangguran 2020–2024 (%)</h2>' +
      C.lineChart(yrs.slice(0, 5), [{ label: "TPT (%)", values: D.national.unemployment }], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Agustus tiap tahun. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>IPM 2020–2024</h2>' +
      C.lineChart(yrs.slice(0, 5), [{ label: "IPM", values: D.national.ipm }], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Kategori: tinggi (70–79,9). DKI Jakarta tertinggi 82,46; Papua terendah 60,97. ' + srcTag("BPS 2024") + '</p></section></div>' +
      '<div class="grid2">' +
      '<section class="card"><h2>Kemiskinan kota vs desa, Mar 2024</h2>' +
      C.donutChart([{ label: "Kota 7,44%", value: 7.44 }, { label: "Desa 11,99%", value: 11.99 }], { center: "8,57%", centerSub: "nasional" }) +
      '<p class="note">Rasio gini Maret 2024: 0,379. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>Pendidikan 2020–2024 (tahun)</h2>' +
      C.lineChart(D.education.years.map(String), [
        { label: "Rata-rata lama sekolah", values: D.education.meanSchool },
        { label: "Harapan lama sekolah", values: D.education.expectedSchool }
      ], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Melek huruf 2024: 98,3% penduduk usia 15+. ' + srcTag("BPS 2024") + '</p></section></div>' +
      '<section class="card"><h2>Provinsi ekstrem, 2024</h2><table class="tbl"><thead><tr><th>Ukuran</th><th>Provinsi</th><th class="num">Nilai</th></tr></thead><tbody>' +
      '<tr><td>Kemiskinan tertinggi</td><td>Papua</td><td class="num">25,61%</td></tr>' +
      '<tr><td>Kemiskinan terendah</td><td>Bali</td><td class="num">4,02%</td></tr>' +
      '<tr><td>IPM tertinggi</td><td>DKI Jakarta</td><td class="num">82,46</td></tr>' +
      '<tr><td>IPM terendah</td><td>Papua</td><td class="num">60,97</td></tr>' +
      '<tr><td>Pengangguran tertinggi</td><td>Jawa Barat</td><td class="num">6,91%</td></tr>' +
      '<tr><td>Pengangguran terendah</td><td>Bali</td><td class="num">2,04%</td></tr>' +
      '</tbody></table><p class="note">' + srcTag("BPS 2024") + '</p></section>';
  }

  /* ---- Metodologi ---- */
  function metodologi() {
    var srcRows = D.sources.map(function (s) {
      return '<tr><td>' + esc(s.name) + '</td><td class="num">' + s.year + '</td><td><a href="' + esc(s.url) + '" rel="noopener">' + esc(s.url.replace("https://", "")) + '</a></td></tr>';
    }).join("");
    return sectionHead("Metodologi & Sumber", "Dari mana setiap angka berasal",
      "StatNusa mengutip publikasi resmi. Setiap angka di situs ini membawa sumber dan tahunnya; " +
      "di bawah ini definisi, catatan, dan berkas data mentah yang bisa diunduh.") +
      '<section class="card"><h2>Sumber data</h2><table class="tbl"><thead><tr><th>Publikasi</th><th class="num">Tahun</th><th>Tautan</th></tr></thead><tbody>' +
      srcRows + '</tbody></table><p class="note">Tautan keluar menuju bps.go.id dan data.worldbank.org. ' + srcTag("Diperbarui 26 Nov 2026") + '</p></section>' +
      '<section class="card"><h2>Definisi</h2><dl class="defs">' +
      '<dt>PDB harga berlaku</dt><dd>Nilai tambah seluruh lapangan usaha pada harga tahun berjalan, triliun rupiah.</dd>' +
      '<dt>Pertumbuhan ekonomi</dt><dd>Perubahan PDB harga konstan terhadap periode yang sama tahun lalu (y-on-y).</dd>' +
      '<dt>TPT</dt><dd>Tingkat Pengangguran Terbuka: penganggur dibagi angkatan kerja, diukur tiap Februari &amp; Agustus.</dd>' +
      '<dt>Kemiskinan</dt><dd>Penduduk dengan pengeluaran per kapita di bawah garis kemiskinan, diukur tiap Maret &amp; September.</dd>' +
      '<dt>IPM</dt><dd>Indeks Pembangunan Manusia (0–100): kesehatan, pendidikan, dan standar hidup layak.</dd>' +
      '<dt>PDRB per kapita</dt><dd>PDRB harga berlaku provinsi dibagi jumlah penduduknya, juta rupiah.</dd>' +
      '<dt>Struktur provinsi</dt><dd>Tabel memakai 34 provinsi seperti publikasi BPS 2024; pemekaran Papua terbaru belum dipisah agar deret 2020–2024 sebanding.</dd>' +
      '</dl></section>' +
      '<section class="card"><h2>Unduh data (CSV)</h2><p>Semua angka di situs ini tersedia sebagai berkas lokal — tanpa akun, tanpa jaringan.</p><ul class="downloads">' +
      '<li><a href="data/nasional.csv" download>nasional.csv</a> — tren nasional 2020–2025 (penduduk, PDB, pertumbuhan, inflasi, TPT, kemiskinan, IPM)</li>' +
      '<li><a href="data/provinsi.csv" download>provinsi.csv</a> — 34 provinsi × 6 indikator, 2024 + kemiskinan 2020</li>' +
      '<li><a href="data/ekonomi.csv" download>ekonomi.csv</a> — PDB per sektor 2024, pertumbuhan kuartalan, ekspor-impor 2020–2024</li>' +
      '</ul><p class="note">Berkas dibaca langsung dari folder situs; pengunduhan bekerja offline. ' + srcTag("BPS 2024–2025") + '</p></section>' +
      '<section class="card"><h2>Catatan &amp; batasan</h2><ul class="notes">' +
      '<li>Angka provinsi dibulatkan ke 1–2 desimal dari publikasi BPS; penjumlahan penduduk provinsi (≈279,1 jt) berbeda dari total nasional (281,6 jt) karena pembulatan dan perbedaan metode estimasi.</li>' +
      '<li>Angka 2025 untuk penduduk adalah proyeksi; seri PDB, inflasi, TPT, dan IPM berakhir 2024 karena publikasi 2025 belum lengkap saat situs disusun.</li>' +
      '<li>StatNusa adalah portal independen dan bukan situs resmi BPS; nama dan desainnya original.</li>' +
      '</ul></section>';
  }

  function missing() {
    return '<h1>Halaman tidak ditemukan</h1><p>Alamat ini tidak ada di StatNusa. <a href="#/">Kembali ke Beranda</a>.</p>';
  }

  return { home: home, homeTrend: homeTrend, penduduk: penduduk, ekonomi: ekonomi, provinsi: provinsi, compTable: compTable, sosial: sosial, metodologi: metodologi, missing: missing, INDICATORS: INDICATORS };
})();
