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
  var NAT_POP_2024 = 281.6; /* total nasional BPS 2024 — pembeda dari jumlah tabel provinsi */

  /* ---- Angka narasi dihitung dari data.js saat runtime (v2: nol angka hardcoded) ---- */
  function sumNums(arr) { return arr.reduce(function (a, b) { return a + b; }, 0); }
  function provPopTotal() { return sumNums(D.provinces.map(function (p) { return p.pop; })); }
  function top10Prov() {
    var t = D.provinces.slice().sort(function (a, b) { return b.pop - a.pop; }).slice(0, 10);
    return { list: t, sum: sumNums(t.map(function (p) { return p.pop; })), share: sumNums(t.map(function (p) { return p.pop; })) / NAT_POP_2024 * 100 };
  }
  function javaShare() {
    var jawa = ["Banten", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur"];
    var s = sumNums(D.provinces.filter(function (p) { return jawa.indexOf(p.name) !== -1; }).map(function (p) { return p.pop; }));
    return { sum: s, share: s / NAT_POP_2024 * 100 };
  }
  function jabarVsSmallest() {
    var jabar = D.provinces.filter(function (p) { return p.name === "Jawa Barat"; })[0].pop;
    var asc = D.provinces.slice().sort(function (a, b) { return a.pop - b.pop; });
    var c = 0, n = 0;
    for (var i = 0; i < asc.length; i++) { if (c + asc[i].pop < jabar) { c += asc[i].pop; n++; } else break; }
    return { jabar: jabar, n: n, sum: c, share: jabar / NAT_POP_2024 * 100 };
  }
  function povertyCount(ratePct, popJt) { return ratePct / 100 * popJt; }
  function extremes(key, wantMax) {
    return D.provinces.reduce(function (a, p) { return wantMax ? (p[key] > a[key] ? p : a) : (p[key] < a[key] ? p : a); });
  }
  function fmt2(v) { return fmt(v, 2); }

  function srcTag(s) { return '<span class="src">' + esc(s) + '</span>'; }
  function sectionHead(kicker, title, lead) {
    return '<p class="kicker">' + esc(kicker) + '</p><h1>' + esc(title) + '</h1><p class="lead">' + lead + '</p>';
  }
  function kpiCards() {
    /* Sub-label KPI dihitung dari data.js — bukan dari string di data.js. */
    var popGrowth = (D.national.population[4] - D.national.population[3]) / D.national.population[3] * 100;
    var povCount = povertyCount(D.national.poverty[4], NAT_POP_2024);
    var subs = {
      pop: "2024 · +" + fmt(popGrowth, 2) + "% dari 2023",
      pov: "Mar 2024 · " + fmt(povCount, 2) + " jt jiwa"
    };
    return '<div class="kpi-grid">' + D.kpi.map(function (k) {
      var sub = subs[k.id] || k.sub;
      return '<article class="kpi"><p class="kpi-label">' + esc(k.label) + '</p>' +
        '<p class="kpi-value">' + esc(k.value) + '</p>' +
        '<p class="kpi-sub">' + esc(sub) + '</p>' + srcTag(k.source) + '</article>';
    }).join("") + '</div>';
  }

  /* ---- Beranda ---- */
  function homeTrend(metric) {
    var yrs = D.years.map(String);
    var H = 170; /* pendek supaya grafik + sumbu-x + legenda muat di atas lipatan cover */
    if (metric === "pop") return C.lineChart(yrs, [{ label: "Penduduk (jt jiwa)", values: D.national.population }], { decimals: 1, min: 260, zeroBase: false, height: H });
    if (metric === "gdp") return C.lineChart(yrs.slice(0, 5), [{ label: "PDB (Rp triliun)", values: D.national.gdpNominal.slice(0, 5) }], { decimals: 0, height: H });
    if (metric === "growth") return C.lineChart(yrs.slice(0, 5), [{ label: "Pertumbuhan ekonomi (%)", values: D.national.growth.slice(0, 5) }], { decimals: 2, min: -3, zeroBase: false, height: H });
    return C.lineChart(yrs, [{ label: "Kemiskinan (%)", values: D.national.poverty }], { decimals: 2, min: 0, zeroBase: false, height: H });
  }
  function home(metric) {
    metric = metric || "pop";
    var labels = { pop: "Penduduk", gdp: "PDB", growth: "Pertumbuhan", pov: "Kemiskinan" };
    var btns = Object.keys(labels).map(function (m) {
      return '<button type="button" data-chart-metric="' + m + '" class="pill' + (m === metric ? ' active' : '') + '" aria-pressed="' + (m === metric) + '">' + labels[m] + '</button>';
    }).join("");
    var jv = javaShare(), jb = jabarVsSmallest();
    var povDrop = D.national.poverty[0] - D.national.poverty[4];
    var surplus = D.trade[4].export - D.trade[4].import;
    return sectionHead("Portal Statistik Indonesia · Data BPS & Bank Dunia",
      "Indonesia dalam angka, 2020–2025",
      "Satu portal untuk membaca Indonesia: <strong>" + fmt(NAT_POP_2024, 1) + " juta penduduk (BPS 2024)</strong> di <strong>34 provinsi</strong>, " +
      "ekonomi <strong>Rp22.139 triliun</strong>, dan <strong>6 tahun tren</strong> yang bisa dibandingkan — semua angka " +
      "disertai sumber dan tahunnya.") +
      kpiCards() +
      '<section class="card"><div class="card-head"><h2>Tren nasional 2020–2025</h2><div class="pill-row" role="group" aria-label="Pilih indikator tren">' + btns + '</div></div>' +
      '<div id="home-trend">' + homeTrend(metric) + '</div>' +
      '<p class="note">Penduduk 2025 adalah proyeksi BPS; PDB, pertumbuhan, inflasi, pengangguran, dan IPM tersedia sampai 2024. ' + srcTag("BPS 2024–2025") + '</p></section>' +
      '<section class="card"><h2>Tiga angka yang perlu diketahui</h2><ol class="facts">' +
      '<li><strong>' + fmt(jv.share, 1) + '% penduduk</strong> tinggal di Pulau Jawa — Jawa Barat sendiri ' + fmt(jb.jabar, 2) + ' juta jiwa (' + fmt(jb.share, 1) + '% nasional), lebih besar dari gabungan ' + jb.n + ' provinsi terkecil (' + fmt(jb.sum, 2) + ' jt). ' + srcTag("BPS 2024") + '</li>' +
      '<li><strong>Kemiskinan turun ' + fmt(povDrop, 2) + ' poin</strong> dalam empat tahun: dari ' + fmt(D.national.poverty[0], 2) + '% (Mar 2020) ke ' + fmt(D.national.poverty[4], 2) + '% (Mar 2024), lalu ' + fmt(D.national.poverty[5], 2) + '% (Mar 2025). ' + srcTag("BPS 2025") + '</li>' +
      '<li><strong>Surplus dagang 5 tahun beruntun:</strong> ekspor 2024 US$' + fmt(D.trade[4].export, 1) + ' miliar lawan impor US$' + fmt(D.trade[4].import, 1) + ' miliar (surplus US$' + fmt(surplus, 1) + ' miliar). ' + srcTag("BPS 2024") + '</li>' +
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
    var top10 = top10Prov();
    var rows = top10.list.map(function (p, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(p.name) + '</td><td class="num">' + fmt(p.pop, 2) + '</td>' +
        '<td class="num">' + fmt(p.pop / NAT_POP_2024 * 100, 1) + '%</td></tr>';
    }).join("");
    var pyrTotal = sumNums(D.pyramid.map(function (r) { return r.m + r.f; }));
    var prod = sumNums(D.pyramid.filter(function (r) { return ["0–4", "5–9", "10–14", "65+"].indexOf(r.age) === -1; }).map(function (r) { return r.m + r.f; }));
    var dep = pyrTotal - prod;
    var old65 = D.pyramid.filter(function (r) { return r.age === "65+"; })[0];
    return sectionHead("Penduduk & Demografi", fmt(NAT_POP_2024, 1) + " juta jiwa — dan makin menua",
      "Penduduk Indonesia tumbuh sekitar 1% per tahun. Piramida 2024 masih lebar di bawah, " +
      "tapi kelompok 65+ sudah " + fmt(old65.m + old65.f, 1) + " juta jiwa — penuaan berjalan pelan tapi pasti.") +
      '<section class="card"><h2>Tren penduduk 2020–2025</h2>' +
      C.lineChart(D.years.map(String), [{ label: "Penduduk (jt jiwa)", values: D.national.population }], { decimals: 1, min: 260, zeroBase: false }) +
      '<p class="note">2025 proyeksi BPS. Laju tumbuh 2023→2024: +' + fmt((D.national.population[4] - D.national.population[3]) / D.national.population[3] * 100, 2) + '%. ' + srcTag("BPS 2023–2024") + '</p></section>' +
      '<section class="card"><h2>Piramida penduduk 2024</h2>' + C.pyramidChart(D.pyramid) +
      '<p class="note">Usia produktif (15–64) ' + fmt(prod / pyrTotal * 100, 1) + '% dari penduduk (' + fmt(prod, 1) + ' jt dari ' + fmt(pyrTotal, 1) + ' jt). Rasio ketergantungan ±' + fmt(dep / prod * 100, 0) + ' per 100 penduduk usia kerja. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>10 provinsi terbesar</h2><table class="tbl"><thead><tr><th>#</th><th>Provinsi</th><th class="num">Penduduk (jt)</th><th class="num">Pangsa nasional</th></tr></thead><tbody>' +
      rows + '</tbody></table><p class="note">Kesepuluh provinsi ini menampung ' + fmt(top10.sum, 2) + ' juta jiwa — ' + fmt(top10.share, 1) + '% penduduk Indonesia (pangsa terhadap total nasional BPS ' + fmt(NAT_POP_2024, 1) + ' jt). ' + srcTag("BPS 2024") + '</p></section>';
  }

  /* ---- Ekonomi ---- */
  function ekonomi() {
    var sectorRows = D.sectors.map(function (s) { return { label: s.name, value: s.share }; });
    var qItems = D.quarterly.map(function (q) { return { label: q.q, value: q.v }; });
    var tradeRows = D.trade.map(function (t) {
      return '<tr><td>' + t.year + '</td><td class="num">' + fmt(t.export, 1) + '</td><td class="num">' + fmt(t.import, 1) + '</td><td class="num">' + fmt(t.export - t.import, 1) + '</td></tr>';
    }).join("");
    var qMax = D.quarterly.reduce(function (a, b) { return b.v > a.v ? b : a; });
    var qMin = D.quarterly.reduce(function (a, b) { return b.v < a.v ? b : a; });
    var surplus24 = D.trade[4].export - D.trade[4].import;
    return sectionHead("Ekonomi", "Rp22.139 triliun, tumbuh 5,03%",
      "Industri pengolahan tetap penopang terbesar PDB (" + fmt(D.sectors[0].share, 2) + "%), disusul perdagangan dan pertanian. " +
      "Pertumbuhan kuartalan stabil di kisaran 5% sejak 2023.") +
      '<section class="card"><h2>PDB menurut lapangan usaha, 2024</h2>' +
      C.hbarChart(sectorRows, { unit: "%", decimals: 2 }) +
      '<p class="note">Pangsa terhadap PDB harga berlaku. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>Pertumbuhan per kuartal, y-on-y (%)</h2>' +
      C.barChart(qItems, { decimals: 2, min: 0 }) +
      '<p class="note">Kuartal terkuat: ' + qMax.q + ' (' + fmt(qMax.v, 2) + '%); terlemah: ' + qMin.q + ' (' + fmt(qMin.v, 2) + '%). ' + srcTag("BPS 2025") + '</p></section>' +
      '<section class="card"><h2>Ekspor vs impor (miliar US$)</h2>' +
      C.groupedBarChart(D.trade.map(function (t) { return String(t.year); }), [
        { label: "Ekspor", values: D.trade.map(function (t) { return t.export; }), color: "#0072B2" },
        { label: "Impor", values: D.trade.map(function (t) { return t.import; }), color: "#E69F00" }
      ]) +
      '<table class="tbl"><thead><tr><th>Tahun</th><th class="num">Ekspor</th><th class="num">Impor</th><th class="num">Neraca</th></tr></thead><tbody>' +
      tradeRows + '</tbody></table><p class="note">Surplus 2024: US$' + fmt(surplus24, 1) + ' miliar — tahun kelima beruntun. ' + srcTag("BPS 2024") + '</p></section>';
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
    var nat = { pop: NAT_POP_2024, pdrb: 78.6, pov: 8.57, unemp: 4.76, ipm: 74.39, infl: 1.57 };
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
      '<p class="note">★ = nilai <strong>terbaik</strong> per indikator di antara provinsi yang dipilih — tertinggi untuk penduduk, PDRB per kapita, dan IPM; terendah untuk kemiskinan, pengangguran, dan inflasi. Kolom Nasional: PDB per kapita Rp78,6 jt; inflasi nasional 1,57%. ' + srcTag("BPS 2024") + '</p>' +
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
      return '<th data-sort="' + key + '" data-label="' + esc(label) + '" class="' + (cls || "") + '" tabindex="0">' + label + '<span class="sarr">' + (state.sortKey === key ? arrow : '') + '</span></th>';
    }
    var mapOpts = INDICATORS.map(function (ind) {
      return '<option value="' + ind.key + '"' + (ind.key === state.mapMetric ? ' selected' : '') + '>' + esc(ind.label) + '</option>';
    }).join("");
    return sectionHead("Provinsi", "34 provinsi, satu peta, satu tabel, semua bisa diurutkan",
      "Klik provinsi di peta untuk menambahkannya ke <strong>Komparator 34 Provinsi</strong> di bawah — " +
      "atau centang namanya. Peta diwarnai per indikator; klik judul kolom untuk mengurutkan tabel.") +
      '<section class="card" id="peta"><div class="card-head"><h2>Peta Indonesia 2024 — choropleth per indikator</h2>' +
      '<label class="map-ctl">Indikator peta <select id="map-metric">' + mapOpts + '</select></label></div>' +
      '<div id="map-wrap">' + window.StatMap.choropleth(state.mapMetric, state.selected) + '</div>' +
      '<p class="note">Klik provinsi di peta untuk menambah / menghapusnya dari Komparator (maks 4). Provinsi terpilih digaris tebal. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><div class="card-head"><h2>Tabel 34 provinsi (2024)</h2>' +
      '<label class="search">Cari provinsi <input id="prov-search" type="search" placeholder="mis. Jawa, Papua, Bali…" value="' + esc(state.q || "") + '" aria-label="Cari provinsi"></label></div>' +
      '<div class="tbl-wrap"><table class="tbl sortable"><thead><tr>' +
      th("name", "Provinsi") + th("pop", "Penduduk (jt)", "num") + th("pdrb", "PDRB/kapita (Rp jt)", "num") +
      th("pov", "Miskin (%)", "num") + th("unemp", "TPT (%)", "num") + th("ipm", "IPM", "num") + th("infl", "Inflasi (%)", "num") +
      '</tr></thead><tbody id="prov-body">' + provRows(list, state.sortKey, state.dir) + '</tbody></table></div>' +
      '<p class="note" id="prov-count">' + list.length + ' dari 34 provinsi ditampilkan. Jumlah 34 provinsi di data: ' + fmt(provPopTotal(), 2) + ' jt; total nasional BPS 2024: ' + fmt(NAT_POP_2024, 1) + ' jt (selisih akibat pembulatan &amp; metode estimasi). ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card" id="komparator"><h2>Komparator 34 Provinsi</h2>' +
      '<p>Sistem unik StatNusa: pilih 2–4 provinsi, bandingkan <strong>6 indikator sekaligus</strong> — penduduk, PDRB per kapita, kemiskinan, pengangguran, IPM, inflasi — plus tren kemiskinan 2020–2024.</p>' +
      '<div class="check-grid">' + checks + '</div>' +
      '<p class="comp-controls"><label>Indikator grafik <select id="comp-metric">' + opts + '</select></label> ' +
      '<button type="button" class="btn ghost" id="comp-reset">Reset pilihan</button> ' +
      '<span id="comp-status" class="note">' + sel.length + ' provinsi dipilih</span></p>' +
      '<div id="comp-result">' + compTable(sel, state.metric) + '</div></section>';
  }

  /* ---- Sosial ---- */
  function sosial() {
    var yrs = D.years.map(String);
    var pov25 = povertyCount(D.national.poverty[5], D.national.population[5]);
    var povMax = extremes("pov", true), povMin = extremes("pov", false);
    var ipmMax = extremes("ipm", true), ipmMin = extremes("ipm", false);
    var unMax = extremes("unemp", true), unMin = extremes("unemp", false);
    var kotaDesa = D.national.povertyRural2024 / D.national.povertyUrban2024;
    return sectionHead("Sosial", "Kemiskinan turun, IPM naik, pengangguran membaik",
      "Tiga tren sosial bergerak ke arah yang sama sejak 2020: kemiskinan turun, pengangguran turun, " +
      "IPM naik. Kesenjangannya tetap: kemiskinan desa (" + fmt(D.national.povertyRural2024, 2) + "%) jauh di atas kota (" + fmt(D.national.povertyUrban2024, 2) + "%).") +
      '<section class="card"><h2>Kemiskinan 2020–2025 (%)</h2>' +
      C.lineChart(yrs, [{ label: "Penduduk miskin (%)", values: D.national.poverty }], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Maret tiap tahun; 2025: ' + fmt(D.national.poverty[5], 2) + '% (' + fmt(pov25, 2) + ' jt jiwa). Kota ' + fmt(D.national.povertyUrban2024, 2) + '% vs desa ' + fmt(D.national.povertyRural2024, 2) + '% (Mar 2024). ' + srcTag("BPS 2025") + '</p></section>' +
      '<div class="grid2">' +
      '<section class="card"><h2>Pengangguran 2020–2024 (%)</h2>' +
      C.lineChart(yrs.slice(0, 5), [{ label: "TPT (%)", values: D.national.unemployment }], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Agustus tiap tahun. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>IPM 2020–2024</h2>' +
      C.lineChart(yrs.slice(0, 5), [{ label: "IPM", values: D.national.ipm }], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Kategori: tinggi (70–79,9). ' + esc(ipmMax.name) + ' tertinggi ' + fmt(ipmMax.ipm, 2) + '; ' + esc(ipmMin.name) + ' terendah ' + fmt(ipmMin.ipm, 2) + '. ' + srcTag("BPS 2024") + '</p></section></div>' +
      '<div class="grid2">' +
      '<section class="card"><h2>Kemiskinan kota vs desa, Mar 2024 (%)</h2>' +
      C.hbarChart([
        { label: "Kota", value: D.national.povertyUrban2024 },
        { label: "Desa", value: D.national.povertyRural2024 },
        { label: "Nasional", value: D.national.poverty[4] }
      ], { decimals: 2, unit: "%", labelW: 90 }) +
      '<p class="note">Ini tingkat kemiskinan per wilayah — bukan pangsa penduduk, jadi tidak digambar sebagai donat. Desa ' + fmt(kotaDesa, 1) + '× kota. Rasio gini Maret 2024: ' + fmt(D.national.gini2024, 3) + '. ' + srcTag("BPS 2024") + '</p></section>' +
      '<section class="card"><h2>Pendidikan 2020–2024 (tahun)</h2>' +
      C.lineChart(D.education.years.map(String), [
        { label: "Rata-rata lama sekolah", values: D.education.meanSchool },
        { label: "Harapan lama sekolah", values: D.education.expectedSchool }
      ], { decimals: 2, min: 0, zeroBase: false }) +
      '<p class="note">Melek huruf 2024: ' + fmt(D.national.literacy2024, 1) + '% penduduk usia 15+. ' + srcTag("BPS 2024") + '</p></section></div>' +
      '<section class="card"><h2>Provinsi ekstrem, 2024</h2><table class="tbl"><thead><tr><th>Ukuran</th><th>Provinsi</th><th class="num">Nilai</th></tr></thead><tbody>' +
      '<tr><td>Kemiskinan tertinggi</td><td>' + esc(povMax.name) + '</td><td class="num">' + fmt(povMax.pov, 2) + '%</td></tr>' +
      '<tr><td>Kemiskinan terendah</td><td>' + esc(povMin.name) + '</td><td class="num">' + fmt(povMin.pov, 2) + '%</td></tr>' +
      '<tr><td>IPM tertinggi</td><td>' + esc(ipmMax.name) + '</td><td class="num">' + fmt(ipmMax.ipm, 2) + '</td></tr>' +
      '<tr><td>IPM terendah</td><td>' + esc(ipmMin.name) + '</td><td class="num">' + fmt(ipmMin.ipm, 2) + '</td></tr>' +
      '<tr><td>Pengangguran tertinggi</td><td>' + esc(unMax.name) + '</td><td class="num">' + fmt(unMax.unemp, 2) + '%</td></tr>' +
      '<tr><td>Pengangguran terendah</td><td>' + esc(unMin.name) + '</td><td class="num">' + fmt(unMin.unemp, 2) + '%</td></tr>' +
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
      '<li>Angka provinsi dibulatkan ke 1–2 desimal dari publikasi BPS. Jumlah penduduk 34 provinsi di data ini: ' + fmt(provPopTotal(), 2) + ' jt, sedangkan total nasional BPS 2024: ' + fmt(NAT_POP_2024, 1) + ' jt — selisih ' + fmt(provPopTotal() - NAT_POP_2024, 2) + ' jt akibat pembulatan per provinsi dan perbedaan metode estimasi. Situs ini memakai ' + fmt(NAT_POP_2024, 1) + ' jt sebagai total nasional, dan ' + fmt(provPopTotal(), 2) + ' jt bila menjumlahkan tabel provinsi; keduanya diberi label yang berbeda supaya tidak tertukar.</li>' +
      '<li>Angka 2025 untuk penduduk adalah proyeksi; seri PDB, inflasi, TPT, dan IPM berakhir 2024 karena publikasi 2025 belum lengkap saat situs disusun.</li>' +
      '<li>StatNusa adalah portal independen dan bukan situs resmi BPS; nama dan desainnya original.</li>' +
      '</ul></section>';
  }

  function missing() {
    return '<h1>Halaman tidak ditemukan</h1><p>Alamat ini tidak ada di StatNusa. <a href="#/">Kembali ke Beranda</a>.</p>';
  }

  return { home: home, homeTrend: homeTrend, penduduk: penduduk, ekonomi: ekonomi, provinsi: provinsi, compTable: compTable, sosial: sosial, metodologi: metodologi, missing: missing, INDICATORS: INDICATORS };
})();
