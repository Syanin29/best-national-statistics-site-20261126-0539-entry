/* StatNusa — grafik SVG tulisan sendiri, tanpa library eksternal.
   Palet aman-buta-warna (Okabe-Ito): biru, jingga, hijau, merah bata,
   magenta, biru langit. Semua grafik punya label sumbu + nilai. */
window.StatCharts = (function () {
  var COLORS = ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#CC79A7", "#56B4E9", "#F0E442"];
  var INK = "#1c2733", GRID = "#dbe2e8", MUTED = "#5a6b7a";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))); var n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function fmt(v, d) { return Number(v).toLocaleString("id-ID", { minimumFractionDigits: d == null ? 0 : d, maximumFractionDigits: d == null ? 0 : d }); }

  function frame(w, h) {
    return { w: w, h: h, L: 52, R: 14, T: 14, B: 34 };
  }

  function yTicks(max, steps) {
    var out = [], i;
    for (i = 0; i <= steps; i++) out.push(max * i / steps);
    return out;
  }

  /* Grafik garis multi-seri. series: [{label, values:[...|null], color}] */
  function lineChart(labels, series, opts) {
    opts = opts || {};
    var f = frame(opts.width || 720, opts.height || 300);
    var iw = f.w - f.L - f.R, ih = f.h - f.T - f.B;
    var all = [];
    series.forEach(function (s) { s.values.forEach(function (v) { if (v != null) all.push(v); }); });
    var lo = opts.min != null ? opts.min : Math.min.apply(null, all);
    var hi = opts.max != null ? opts.max : Math.max.apply(null, all);
    if (opts.zeroBase !== false && lo > 0) lo = Math.min(lo, 0);
    if (hi - lo < 1e-9) { hi = lo + 1; }
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var X = function (i) { return f.L + (labels.length === 1 ? iw / 2 : iw * i / (labels.length - 1)); };
    var Y = function (v) { return f.T + ih - (v - lo) / (hi - lo) * ih; };
    var s = '<svg viewBox="0 0 ' + f.w + ' ' + f.h + '" role="img" aria-label="Grafik garis" class="chart-svg">';
    yTicks(hi, 4).forEach(function (t) {
      var y = Y(t);
      s += '<line x1="' + f.L + '" y1="' + y.toFixed(1) + '" x2="' + (f.w - f.R) + '" y2="' + y.toFixed(1) + '" stroke="' + GRID + '"/>';
      s += '<text x="' + (f.L - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" class="tick">' + fmt(t, opts.decimals || 0) + '</text>';
    });
    labels.forEach(function (lb, i) {
      s += '<text x="' + X(i).toFixed(1) + '" y="' + (f.h - 10) + '" text-anchor="middle" class="tick">' + esc(lb) + '</text>';
    });
    series.forEach(function (sr, si) {
      var col = sr.color || COLORS[si % COLORS.length];
      var pts = [], path = "";
      sr.values.forEach(function (v, i) {
        if (v == null) return;
        pts.push([X(i), Y(v), v]);
      });
      pts.forEach(function (p, k) { path += (k ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1); });
      s += '<path d="' + path + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round"/>';
      pts.forEach(function (p) {
        s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="' + col + '"><title>' + esc(sr.label) + ': ' + fmt(p[2], opts.decimals || 0) + '</title></circle>';
      });
    });
    s += "</svg>";
    s += '<div class="legend">' + series.map(function (sr, si) {
      var col = sr.color || COLORS[si % COLORS.length];
      return '<span><i style="background:' + col + '"></i>' + esc(sr.label) + "</span>";
    }).join("") + "</div>";
    return s;
  }

  /* Grafik batang vertikal. items: [{label, value}] */
  function barChart(items, opts) {
    opts = opts || {};
    var f = frame(opts.width || 720, opts.height || 300);
    var iw = f.w - f.L - f.R, ih = f.h - f.T - f.B;
    var max = niceMax(Math.max.apply(null, items.map(function (d) { return d.value; })));
    var min = opts.min != null ? opts.min : 0;
    var slot = iw / items.length, bw = Math.min(46, slot * 0.62);
    var Y = function (v) { return f.T + ih - (v - min) / (max - min) * ih; };
    var s = '<svg viewBox="0 0 ' + f.w + ' ' + f.h + '" role="img" aria-label="Grafik batang" class="chart-svg">';
    yTicks(max, 4).forEach(function (t) {
      var y = Y(t);
      s += '<line x1="' + f.L + '" y1="' + y.toFixed(1) + '" x2="' + (f.w - f.R) + '" y2="' + y.toFixed(1) + '" stroke="' + GRID + '"/>';
      s += '<text x="' + (f.L - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" class="tick">' + fmt(t, opts.decimals || 0) + '</text>';
    });
    items.forEach(function (d, i) {
      var x = f.L + slot * i + (slot - bw) / 2;
      var y = Y(d.value), col = d.color || COLORS[i % COLORS.length];
      s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (f.T + ih - y).toFixed(1) + '" fill="' + col + '" rx="3"><title>' + esc(d.label) + ': ' + fmt(d.value, opts.decimals || 0) + (opts.unit || "") + '</title></rect>';
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle" class="tick val">' + fmt(d.value, opts.decimals || 0) + '</text>';
      s += '<text x="' + (f.L + slot * i + slot / 2).toFixed(1) + '" y="' + (f.h - 10) + '" text-anchor="middle" class="tick">' + esc(d.label) + '</text>';
    });
    return s + "</svg>";
  }

  /* Grafik batang horizontal berlabel — untuk sektor & peringkat provinsi. */
  function hbarChart(items, opts) {
    opts = opts || {};
    var rowH = opts.rowH || 30, top = 8, w = opts.width || 720;
    var h = top + items.length * rowH + 8;
    var max = Math.max.apply(null, items.map(function (d) { return d.value; }));
    var labW = opts.labelW || 210, valW = 64;
    var bw = w - labW - valW - 10;
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Grafik batang horizontal" class="chart-svg">';
    items.forEach(function (d, i) {
      var y = top + i * rowH, col = d.color || COLORS[i % COLORS.length];
      var len = Math.max(2, d.value / max * bw);
      s += '<text x="0" y="' + (y + 15) + '" class="tick lbl">' + esc(d.label) + '</text>';
      s += '<rect x="' + labW + '" y="' + (y + 3) + '" width="' + len.toFixed(1) + '" height="16" fill="' + col + '" rx="3"><title>' + esc(d.label) + ': ' + fmt(d.value, opts.decimals || 0) + (opts.unit || "") + '</title></rect>';
      s += '<text x="' + (labW + len + 6) + '" y="' + (y + 16) + '" class="tick val">' + fmt(d.value, opts.decimals || 0) + (opts.unit || "") + '</text>';
    });
    return s + "</svg>";
  }

  /* Batang berkelompok: beberapa seri per kategori (ekspor vs impor). */
  function groupedBarChart(labels, series, opts) {
    opts = opts || {};
    var f = frame(opts.width || 720, opts.height || 300);
    var iw = f.w - f.L - f.R, ih = f.h - f.T - f.B;
    var all = [];
    series.forEach(function (sr) { sr.values.forEach(function (v) { all.push(v); }); });
    var max = niceMax(Math.max.apply(null, all));
    var slot = iw / labels.length, gw = Math.min(110, slot * 0.7), bw = gw / series.length;
    var Y = function (v) { return f.T + ih - v / max * ih; };
    var s = '<svg viewBox="0 0 ' + f.w + ' ' + f.h + '" role="img" aria-label="Grafik batang berkelompok" class="chart-svg">';
    yTicks(max, 4).forEach(function (t) {
      var y = Y(t);
      s += '<line x1="' + f.L + '" y1="' + y.toFixed(1) + '" x2="' + (f.w - f.R) + '" y2="' + y.toFixed(1) + '" stroke="' + GRID + '"/>';
      s += '<text x="' + (f.L - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" class="tick">' + fmt(t, 0) + '</text>';
    });
    labels.forEach(function (lb, i) {
      series.forEach(function (sr, si) {
        var col = sr.color || COLORS[si % COLORS.length];
        var x = f.L + slot * i + (slot - gw) / 2 + si * bw;
        var y = Y(sr.values[i]);
        s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + (f.T + ih - y).toFixed(1) + '" fill="' + col + '" rx="2"><title>' + esc(sr.label) + ' ' + esc(lb) + ': ' + fmt(sr.values[i], 0) + '</title></rect>';
      });
      s += '<text x="' + (f.L + slot * i + slot / 2).toFixed(1) + '" y="' + (f.h - 10) + '" text-anchor="middle" class="tick">' + esc(lb) + '</text>';
    });
    s += "</svg>";
    s += '<div class="legend">' + series.map(function (sr, si) {
      return '<span><i style="background:' + (sr.color || COLORS[si % COLORS.length]) + '"></i>' + esc(sr.label) + "</span>";
    }).join("") + "</div>";
    return s;
  }

  /* Donat: pangsa persen, maks 5 irisan + "lainnya". */
  function donutChart(items, opts) {
    opts = opts || {};
    var size = opts.size || 220, cx = size / 2, cy = size / 2, r = size / 2 - 14, ir = r * 0.58;
    var total = items.reduce(function (a, d) { return a + d.value; }, 0);
    var a0 = -Math.PI / 2, s = '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Grafik donat" class="chart-svg donut">';
    items.forEach(function (d, i) {
      var frac = d.value / total, a1 = a0 + frac * Math.PI * 2;
      var large = frac > 0.5 ? 1 : 0;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      var xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1);
      var xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0);
      var col = d.color || COLORS[i % COLORS.length];
      s += '<path d="M' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' L' + xi1.toFixed(1) + ',' + yi1.toFixed(1) + ' A' + ir + ',' + ir + ' 0 ' + large + ' 0 ' + xi0.toFixed(1) + ',' + yi0.toFixed(1) + ' Z" fill="' + col + '"><title>' + esc(d.label) + ': ' + fmt(d.value, 1) + '%</title></path>';
      a0 = a1;
    });
    s += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" class="donut-big">' + esc(opts.center || "") + '</text>';
    s += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" class="tick">' + esc(opts.centerSub || "") + '</text></svg>';
    s += '<div class="legend">' + items.map(function (d, i) {
      return '<span><i style="background:' + (d.color || COLORS[i % COLORS.length]) + '"></i>' + esc(d.label) + " " + fmt(d.value, 1) + "%</span>";
    }).join("") + "</div>";
    return s;
  }

  /* Piramida penduduk: batang laki-laki ke kiri, perempuan ke kanan. */
  function pyramidChart(rows, opts) {
    opts = opts || {};
    var w = opts.width || 720, rowH = 24, top = 26, h = top + rows.length * rowH + 10;
    var max = Math.max.apply(null, rows.map(function (r) { return Math.max(r.m, r.f); }));
    var mid = w / 2, half = mid - 56;
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Piramida penduduk" class="chart-svg">';
    s += '<text x="' + (mid - half / 2) + '" y="14" text-anchor="middle" class="tick">Laki-laki (jt)</text>';
    s += '<text x="' + (mid + half / 2) + '" y="14" text-anchor="middle" class="tick">Perempuan (jt)</text>';
    rows.forEach(function (r, i) {
      var y = top + i * rowH;
      var lm = r.m / max * half, lf = r.f / max * half;
      s += '<text x="' + mid + '" y="' + (y + 14) + '" text-anchor="middle" class="tick">' + esc(r.age) + '</text>';
      s += '<rect x="' + (mid - 34 - lm).toFixed(1) + '" y="' + (y + 2) + '" width="' + lm.toFixed(1) + '" height="16" fill="#0072B2" rx="2"><title>Laki-laki ' + esc(r.age) + ': ' + r.m + ' jt</title></rect>';
      s += '<rect x="' + (mid + 34) + '" y="' + (y + 2) + '" width="' + lf.toFixed(1) + '" height="16" fill="#CC79A7" rx="2"><title>Perempuan ' + esc(r.age) + ': ' + r.f + ' jt</title></rect>';
    });
    return s + "</svg>";
  }

  return { lineChart: lineChart, barChart: barChart, hbarChart: hbarChart, groupedBarChart: groupedBarChart, donutChart: donutChart, pyramidChart: pyramidChart, COLORS: COLORS, fmt: fmt, esc: esc };
})();
