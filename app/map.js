/* StatNusa — Peta choropleth Indonesia (SVG tulisan sendiri, tanpa library).
   Poligon provinsi disederhanakan dari garis pantai & batas provinsi (proyeksi
   equirectangular: x = (lon-94,5)*15,5; y = (6,5-lat)*19; viewBox 760x330).
   Bentuknya sengaja mengikuti lekuk kepulauan — Sumatra miring barat laut,
   Jawa memanjang, Kalimantan membulat, Sulawesi berkaki empat, Papua di timur —
   supaya terbaca sebagai Indonesia, bukan grid abstrak. Klik provinsi
   menambahkannya ke Komparator (maks 4). Warna: skala sekuensial 5 tingkat
   per indikator; semakin gelap = nilai semakin tinggi. */
window.StatMap = (function () {
  var IND = null;
  function indicators() {
    if (!IND) IND = window.StatViews ? window.StatViews.INDICATORS : [];
    return IND;
  }
  function indMeta(key) {
    var list = indicators(), i;
    for (i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
    return { key: key, label: key, decimals: 2, lowerBetter: false };
  }

  /* [lon, lat] per provinsi — urutan sama dengan data.js (34 provinsi). */
  var SHAPES = {
    "Aceh": [[95.2, 5.9], [96.8, 5.9], [98.0, 5.4], [98.1, 4.0], [97.2, 2.9], [95.9, 2.9], [95.2, 4.3]],
    "Sumatera Utara": [[98.1, 4.0], [99.6, 3.9], [100.4, 2.6], [100.6, 1.6], [99.6, 0.7], [98.5, 1.5], [98.0, 2.8]],
    "Sumatera Barat": [[99.6, 0.7], [100.6, 1.6], [100.8, 0.2], [100.4, -1.4], [99.4, -1.9], [98.9, -0.6]],
    "Riau": [[100.6, 1.6], [102.2, 1.7], [103.2, 0.6], [102.8, -0.8], [101.6, -1.2], [100.8, 0.2]],
    "Jambi": [[101.6, -1.2], [102.8, -0.8], [103.6, -1.6], [103.6, -2.9], [102.2, -3.2], [100.9, -2.4], [100.4, -1.4]],
    "Sumatera Selatan": [[100.9, -2.4], [102.2, -3.2], [104.0, -2.9], [104.6, -4.0], [104.2, -5.2], [102.6, -5.2], [101.2, -4.2], [100.4, -3.2]],
    "Bengkulu": [[99.4, -1.9], [100.4, -1.4], [100.9, -2.4], [100.4, -3.2], [100.6, -4.8], [99.6, -4.9], [99.0, -3.2]],
    "Lampung": [[102.6, -5.2], [104.2, -5.2], [105.3, -5.0], [105.6, -5.9], [104.6, -6.1], [103.4, -5.9]],
    "Kep. Bangka Belitung": [[105.2, -1.6], [106.4, -1.7], [106.6, -2.9], [105.6, -3.2], [105.0, -2.2]],
    "Kep. Riau": [[103.6, 1.1], [104.9, 1.3], [105.1, 0.2], [104.0, -0.2], [103.5, 0.3]],
    "DKI Jakarta": [[106.6, -6.0], [107.1, -6.0], [107.1, -6.4], [106.6, -6.4]],
    "Jawa Barat": [[106.5, -6.0], [108.6, -6.1], [108.8, -7.0], [108.2, -7.9], [106.4, -7.6], [106.4, -6.9]],
    "Jawa Tengah": [[108.6, -6.1], [110.9, -6.5], [111.2, -7.3], [110.6, -8.1], [108.2, -7.9], [108.8, -7.0]],
    "DI Yogyakarta": [[110.0, -7.6], [110.5, -7.6], [110.6, -8.1], [110.0, -8.2]],
    "Jawa Timur": [[110.9, -6.5], [113.0, -6.8], [114.4, -7.2], [114.6, -8.2], [113.0, -8.6], [111.2, -7.3]],
    "Banten": [[105.4, -5.9], [106.5, -6.0], [106.4, -6.9], [105.5, -6.9]],
    "Bali": [[114.4, -8.1], [115.6, -8.1], [115.7, -8.8], [114.5, -8.9]],
    "Nusa Tenggara Barat": [[115.8, -8.3], [117.5, -8.3], [119.0, -8.5], [119.0, -9.3], [116.0, -9.2], [115.8, -8.8]],
    "Nusa Tenggara Timur": [[119.2, -8.4], [121.0, -8.7], [123.0, -9.3], [124.6, -9.6], [125.0, -10.4], [123.5, -10.6], [120.5, -10.3], [119.2, -9.6]],
    "Kalimantan Barat": [[108.9, 1.9], [110.8, 2.6], [111.9, 1.2], [111.6, -0.6], [110.2, -1.8], [108.9, -0.6]],
    "Kalimantan Tengah": [[111.9, 1.2], [113.8, 1.6], [114.9, 0.2], [114.6, -1.6], [113.4, -3.4], [111.6, -2.6], [111.6, -0.6]],
    "Kalimantan Selatan": [[114.9, 0.2], [116.3, -0.8], [116.6, -2.6], [115.6, -4.0], [114.2, -3.8], [113.4, -3.4], [114.6, -1.6]],
    "Kalimantan Timur": [[113.8, 1.6], [116.0, 2.2], [117.6, 1.6], [117.4, -0.4], [116.3, -0.8], [114.9, 0.2]],
    "Kalimantan Utara": [[115.6, 4.3], [117.0, 4.0], [117.6, 1.6], [116.0, 2.2], [115.2, 3.0]],
    "Sulawesi Utara": [[123.6, 1.6], [124.8, 1.3], [124.9, 0.2], [123.8, -0.2], [123.2, 0.6]],
    "Sulawesi Tengah": [[119.6, 0.9], [121.4, -0.1], [122.8, -0.7], [122.2, -1.8], [120.8, -2.8], [119.6, -2.2], [119.2, -0.6]],
    "Sulawesi Selatan": [[119.6, -2.2], [120.8, -2.8], [120.6, -4.4], [120.2, -6.0], [119.2, -5.6], [119.0, -3.4], [119.8, -3.6]],
    "Sulawesi Tenggara": [[120.8, -2.8], [122.2, -1.8], [123.0, -3.2], [122.6, -5.2], [121.4, -5.4], [120.6, -4.4]],
    "Gorontalo": [[121.6, 1.0], [123.2, 0.6], [123.8, -0.2], [122.8, -0.7], [121.4, -0.1]],
    "Sulawesi Barat": [[119.2, -0.6], [119.6, -2.2], [119.8, -3.6], [119.0, -3.4], [118.8, -1.6]],
    "Maluku": [[126.2, -2.6], [128.2, -2.8], [129.0, -4.2], [127.8, -5.6], [126.2, -4.8]],
    "Maluku Utara": [[126.8, 2.2], [128.4, 1.8], [128.6, 0.2], [127.4, -0.4], [126.6, 0.8]],
    "Papua Barat": [[130.4, -0.4], [132.6, -0.8], [133.2, -2.0], [132.4, -3.8], [130.6, -3.4], [130.0, -1.6]],
    "Papua": [[133.2, -2.0], [136.0, -1.2], [139.0, -1.6], [141.0, -2.2], [141.0, -8.0], [138.0, -8.4], [135.0, -7.6], [133.0, -5.0], [132.4, -3.8]]
  };

  /* Skala sekuensial 5 tingkat, aman-buta-warna (ColorBrewer YlGnBu / YlOrBr). */
  var RAMP_HIGHER_OK = ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"];
  var RAMP_HIGHER_BAD = ["#ffffd4", "#fed98e", "#fe9929", "#d95f0e", "#993404"];
  var fmt = window.StatCharts ? window.StatCharts.fmt : function (v, d) { return String(v); };
  var esc = window.StatCharts ? window.StatCharts.esc : function (s) { return String(s); };

  function project(lon, lat) { return [(lon - 94.5) * 15.5, (6.5 - lat) * 19]; }
  function pathFor(poly) {
    return poly.map(function (pt, i) {
      var xy = project(pt[0], pt[1]);
      return (i ? "L" : "M") + xy[0].toFixed(1) + "," + xy[1].toFixed(1);
    }).join("") + "Z";
  }

  /* Choropleth: svg peta + legenda. selected = array nama provinsi terpilih. */
  function choropleth(indKey, selected) {
    var D = window.STATNUSA;
    var meta = indMeta(indKey);
    var byName = {};
    D.provinces.forEach(function (p) { byName[p.name] = p; });
    var vals = D.provinces.map(function (p) { return p[indKey]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var ramp = meta.lowerBetter ? RAMP_HIGHER_BAD : RAMP_HIGHER_OK;
    /* Skala kuintil (bukan interval sama-rata): data provinsi sangat miring
       (mis. penduduk 0,74–50,35 jt) — interval linear membuat 30 provinsi
       nyaris putih. Kuintil menjamin tiap tingkat warna terisi ±7 provinsi. */
    var sorted = vals.slice().sort(function (a, b) { return a - b; });
    var cuts = [sorted[6], sorted[13], sorted[20], sorted[27]];
    function color(v) {
      var k = 0;
      while (k < 4 && v > cuts[k]) k++;
      return ramp[k];
    }
    var sel = selected || [];
    var s = '<svg id="indonesia-map" viewBox="0 0 760 330" role="img" aria-label="Peta Indonesia per provinsi" class="map-svg">';
    D.provinces.forEach(function (p) {
      var poly = SHAPES[p.name];
      if (!poly) return;
      var isSel = sel.indexOf(p.name) !== -1;
      s += '<path class="prov' + (isSel ? ' selected' : '') + '" data-prov="' + esc(p.name) + '" d="' + pathFor(poly) +
        '" fill="' + color(p[indKey]) + '"' + (isSel ? ' stroke-width="2.5"' : "") +
        '><title>' + esc(p.name) + ': ' + esc(meta.label) + ' ' + fmt(p[indKey], meta.decimals) +
        ' — klik untuk ' + (isSel ? 'menghapus dari' : 'menambah ke') + ' Komparator</title></path>';
    });
    s += "</svg>";
    /* Legenda: 5 kuintil + arah baca. */
    var edges = [lo].concat(cuts).concat([hi]);
    var legend = '<div class="map-legend" aria-label="Legenda peta"><span class="map-legend-label">Semakin gelap = nilai semakin tinggi ·</span>';
    for (var i = 0; i < 5; i++) {
      legend += '<span class="map-sw"><i style="background:' + ramp[i] + '"></i>' +
        fmt(edges[i], meta.decimals) + '–' + fmt(edges[i + 1], meta.decimals) + "</span>";
    }
    legend += '<span class="map-legend-label">(' + esc(meta.label) + ', 2024)</span></div>';
    return s + legend;
  }

  return { choropleth: choropleth, shapes: SHAPES, project: project };
})();
