/* StatNusa — router hash + interaksi. Rute:
   #/            Beranda        #/provinsi   Provinsi + Komparator
   #/penduduk    Demografi      #/sosial     Sosial
   #/ekonomi     Ekonomi        #/metodologi Metodologi & Sumber
   window.__shotReady false selama render, true sesudahnya, supaya
   skrip screenshot tahu kapan menangkap layar. */
(function () {
  var V = window.StatViews, D = window.STATNUSA;
  var app = document.getElementById("app");
  var nav = document.getElementById("main-nav");

  var state = {
    homeMetric: "pop",
    prov: { q: "", sortKey: "pop", dir: -1, selected: ["DKI Jakarta", "Jawa Barat", "Jawa Timur"], metric: "pov", mapMetric: "pop" }
  };

  var TITLES = {
    "/": "StatNusa — Statistik Indonesia 2025: 281,6 Juta Penduduk, 38 Provinsi, Peta + Komparator, 6 Tahun Tren",
    "/penduduk": "Penduduk & Demografi | StatNusa",
    "/ekonomi": "Ekonomi | StatNusa",
    "/provinsi": "Provinsi & Komparator 38 Provinsi | StatNusa",
    "/sosial": "Sosial | StatNusa",
    "/metodologi": "Metodologi & Sumber | StatNusa"
  };

  function route() {
    var h = location.hash.replace(/^#/, "") || "/";
    return TITLES[h] ? h : "/missing";
  }

  function render() {
    window.__shotReady = false;
    var r = route();
    var html;
    if (r === "/") html = V.home(state.homeMetric);
    else if (r === "/penduduk") html = V.penduduk();
    else if (r === "/ekonomi") html = V.ekonomi();
    else if (r === "/provinsi") html = V.provinsi(state.prov);
    else if (r === "/sosial") html = V.sosial();
    else if (r === "/metodologi") html = V.metodologi();
    else html = V.missing();
    app.innerHTML = html;
    document.title = TITLES[r] || "StatNusa — Portal Statistik Indonesia";
    if (nav) {
      nav.querySelectorAll("a").forEach(function (a) {
        var href = a.getAttribute("href");
        var path = href.replace(/^#/, "") || "/";
        if (path === r) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
    }
    wire(r);
    window.scrollTo(0, 0);
    window.__shotReady = true;
  }

  function wire(r) {
    if (r === "/") {
      app.querySelectorAll("[data-chart-metric]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.homeMetric = btn.getAttribute("data-chart-metric");
          document.getElementById("home-trend").innerHTML = V.homeTrend(state.homeMetric);
          app.querySelectorAll("[data-chart-metric]").forEach(function (b) {
            var on = b === btn;
            b.classList.toggle("active", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          });
        });
      });
    }
    if (r === "/provinsi") {
      var search = document.getElementById("prov-search");
      var body = document.getElementById("prov-body");
      var count = document.getElementById("prov-count");
      var prov = state.prov;

      function refreshTable() {
        var q = prov.q.toLowerCase();
        var list = D.provinces.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) !== -1; });
        var sorted = list.slice().sort(function (a, b) {
          var av = a[prov.sortKey], bv = b[prov.sortKey];
          return (typeof av === "string" ? av.localeCompare(bv, "id") : av - bv) * prov.dir;
        });
        body.innerHTML = sorted.map(function (p) {
          return "<tr><td>" + p.name.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</td>" +
            '<td class="num">' + p.pop.toFixed(2) + '</td><td class="num">' + p.pdrb.toFixed(1) + '</td>' +
            '<td class="num">' + p.pov.toFixed(2) + '</td><td class="num">' + p.unemp.toFixed(2) + '</td>' +
            '<td class="num">' + p.ipm.toFixed(2) + '</td><td class="num">' + p.infl.toFixed(1) + "</td></tr>";
        }).join("");
        var totalProv = D.provinces.reduce(function (a, p) { return a + p.pop; }, 0);
        count.textContent = list.length + " dari 38 provinsi ditampilkan. Jumlah 38 provinsi di data: " +
          totalProv.toFixed(2).replace(".", ",") + " jt; total nasional BPS 2024: 281,6 jt (selisih akibat pembulatan & metode estimasi). Sumber: BPS 2024.";
      }
      function refreshMap() {
        var wrap = document.getElementById("map-wrap");
        if (wrap && window.StatMap) wrap.innerHTML = window.StatMap.choropleth(prov.mapMetric, prov.selected);
      }
      function refreshComp() {
        var sel = D.provinces.filter(function (p) { return prov.selected.indexOf(p.name) !== -1; });
        document.getElementById("comp-result").innerHTML = V.compTable(sel, prov.metric);
        var st = document.getElementById("comp-status");
        if (st) st.textContent = sel.length + " provinsi dipilih";
      }
      /* Satu jalur toggle dipakai checkbox Komparator DAN klik peta — hasilnya sama. */
      function toggleProv(name, want) {
        var i = prov.selected.indexOf(name);
        if (want && i === -1) {
          if (prov.selected.length >= 4) {
            document.getElementById("comp-status").textContent = "Maksimal 4 provinsi — hapus satu pilihan dulu.";
            return false;
          }
          prov.selected.push(name);
        } else if (!want && i !== -1) {
          prov.selected.splice(i, 1);
        }
        app.querySelectorAll("[data-comp-prov]").forEach(function (cb) {
          cb.checked = prov.selected.indexOf(cb.getAttribute("value")) !== -1;
        });
        refreshComp();
        refreshMap();
        return true;
      }
      if (search) {
        search.addEventListener("input", function () { prov.q = search.value; refreshTable(); });
      }
      app.querySelectorAll("th[data-sort]").forEach(function (th) {
        function sort() {
          var key = th.getAttribute("data-sort");
          if (prov.sortKey === key) prov.dir = -prov.dir;
          else { prov.sortKey = key; prov.dir = key === "name" ? 1 : -1; }
          /* v2: sort HANYA me-refresh <tbody> + panah — tanpa render() penuh,
             supaya halaman tidak terlempar ke atas (bug v1: render + scrollTo). */
          refreshTable();
          app.querySelectorAll("th[data-sort]").forEach(function (t) {
            var arr = t.querySelector(".sarr");
            if (arr) arr.textContent = t.getAttribute("data-sort") === prov.sortKey ? (prov.dir === 1 ? " ▲" : " ▼") : "";
          });
        }
        th.addEventListener("click", sort);
        th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sort(); } });
      });
      app.querySelectorAll("[data-comp-prov]").forEach(function (cb) {
        cb.addEventListener("change", function () {
          var name = cb.getAttribute("value");
          if (!toggleProv(name, cb.checked)) cb.checked = false;
        });
      });
      /* Peta: pilih indikator + klik provinsi (delegasi — peta di-render ulang tiap toggle). */
      var mapMetric = document.getElementById("map-metric");
      if (mapMetric) mapMetric.addEventListener("change", function () { prov.mapMetric = mapMetric.value; refreshMap(); });
      var mapWrap = document.getElementById("map-wrap");
      if (mapWrap) mapWrap.addEventListener("click", function (e) {
        var path = e.target.closest ? e.target.closest("path[data-prov]") : null;
        if (!path) return;
        var name = path.getAttribute("data-prov");
        toggleProv(name, prov.selected.indexOf(name) === -1);
      });
      var metric = document.getElementById("comp-metric");
      if (metric) metric.addEventListener("change", function () { prov.metric = metric.value; refreshComp(); });
      var reset = document.getElementById("comp-reset");
      if (reset) reset.addEventListener("click", function () {
        prov.selected = ["DKI Jakarta", "Jawa Barat", "Jawa Timur"];
        app.querySelectorAll("[data-comp-prov]").forEach(function (cb) {
          cb.checked = prov.selected.indexOf(cb.getAttribute("value")) !== -1;
        });
        refreshComp();
        refreshMap();
      });
    }
  }

  /* Tema terang/gelap — tersimpan lokal, default terang. */
  var themeBtn = document.getElementById("theme-toggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    if (themeBtn) themeBtn.textContent = t === "dark" ? "☀️ Terang" : "🌙 Gelap";
    try { localStorage.setItem("statnusa-theme", t); } catch (e) { /* abaikan */ }
  }
  if (themeBtn) {
    var saved = null;
    try { saved = localStorage.getItem("statnusa-theme"); } catch (e) { /* abaikan */ }
    applyTheme(saved === "dark" ? "dark" : "light");
    themeBtn.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  window.addEventListener("hashchange", render);
  render();
})();
