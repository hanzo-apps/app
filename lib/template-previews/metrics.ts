/**
 * "metrics" — a real, self-contained analytics dashboard served as the edit-mode
 * preview (and starting index.html) for the `metrics` gallery slug. See
 * lib/template-previews.ts for why this exists.
 *
 * Fully standalone: inline CSS + inline JS, charts drawn as inline SVG/CSS (no
 * external CSS/JS/font/image — CSP-safe). Theme-aware: light by default, dark via
 * `prefers-color-scheme` and an explicit `[data-theme="dark"]` / `.dark` on <html>
 * (an explicit stamp wins over the OS setting, both ways). Palette + mark specs
 * follow the data-viz reference (blue categorical slot, neutral comparison line,
 * reserved status palette, thin marks, 4px rounded data-ends, hairline grid).
 *
 * NOTE: kept free of backticks and the ${ sequence so it embeds cleanly as a
 * template literal; the inline script uses string concatenation only.
 */
export const METRICS_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>Metrics — Analytics Dashboard</title>
<style>
  :root{
    color-scheme: light;
    --page:#f9f9f7; --surface:#fcfcfb; --surface-2:#ffffff;
    --text-primary:#0b0b0b; --text-secondary:#52514e; --muted:#898781;
    --grid:#e1e0d9; --axis:#c3c2b7; --border:rgba(11,11,11,0.10);
    --series-1:#2a78d6; --series-1-wash:rgba(42,120,214,0.12); --compare:#8a8984;
    --good:#006300; --warning:#8a5300; --critical:#b7302f;
    --good-bg:rgba(12,163,12,0.12); --warning-bg:rgba(250,178,25,0.18); --critical-bg:rgba(208,59,59,0.12);
    --track:#eeede8;
    --shadow:0 1px 2px rgba(11,11,11,0.05), 0 10px 26px rgba(11,11,11,0.045);
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]):not(.light){
      color-scheme: dark;
      --page:#0d0d0d; --surface:#191918; --surface-2:#201f1e;
      --text-primary:#ffffff; --text-secondary:#c3c2b7; --muted:#8f8e88;
      --grid:#2c2c2a; --axis:#3a3a37; --border:rgba(255,255,255,0.10);
      --series-1:#3987e5; --series-1-wash:rgba(57,135,229,0.16); --compare:#8f8e88;
      --good:#0ca30c; --warning:#fab219; --critical:#e26a6a;
      --good-bg:rgba(12,163,12,0.16); --warning-bg:rgba(250,178,25,0.16); --critical-bg:rgba(226,106,106,0.16);
      --track:#26251f;
      --shadow:0 1px 2px rgba(0,0,0,0.45), 0 10px 26px rgba(0,0,0,0.4);
    }
  }
  :root[data-theme="dark"], :root.dark{
    color-scheme: dark;
    --page:#0d0d0d; --surface:#191918; --surface-2:#201f1e;
    --text-primary:#ffffff; --text-secondary:#c3c2b7; --muted:#8f8e88;
    --grid:#2c2c2a; --axis:#3a3a37; --border:rgba(255,255,255,0.10);
    --series-1:#3987e5; --series-1-wash:rgba(57,135,229,0.16); --compare:#8f8e88;
    --good:#0ca30c; --warning:#fab219; --critical:#e26a6a;
    --good-bg:rgba(12,163,12,0.16); --warning-bg:rgba(250,178,25,0.16); --critical-bg:rgba(226,106,106,0.16);
    --track:#26251f;
    --shadow:0 1px 2px rgba(0,0,0,0.45), 0 10px 26px rgba(0,0,0,0.4);
  }

  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:var(--page)}
  body{
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color:var(--text-primary);
    line-height:1.45;
    -webkit-font-smoothing:antialiased;
    min-height:100vh;
    padding:24px;
  }
  .wrap{max-width:1120px;margin:0 auto}
  .num{font-variant-numeric:tabular-nums}

  /* Top bar */
  .topbar{display:flex;align-items:center;gap:14px;margin-bottom:22px}
  .brand{display:flex;align-items:center;gap:11px}
  .brand-mark{width:30px;height:30px;border-radius:8px;background:var(--series-1);
    display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow)}
  .brand-mark svg{display:block}
  .brand-name{font-size:16px;font-weight:650;letter-spacing:-0.01em}
  .brand-sub{font-size:12.5px;color:var(--muted);margin-top:-2px}
  .topbar-right{margin-left:auto;display:flex;align-items:center;gap:12px}
  .period{font-size:12.5px;color:var(--text-secondary);background:var(--surface);
    border:1px solid var(--border);padding:7px 12px;border-radius:9px}
  .avatar{width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,var(--series-1),#7a5cf0);
    color:#fff;font-size:12px;font-weight:650;display:flex;align-items:center;justify-content:center}

  /* Cards */
  .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;
    box-shadow:var(--shadow)}
  .card-h{display:flex;align-items:center;gap:12px;padding:16px 18px 0}
  .card-title{font-size:14px;font-weight:620}
  .card-sub{font-size:12px;color:var(--muted);margin-top:1px}

  /* KPI tiles */
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px}
  .kpi{padding:16px 18px}
  .kpi-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .kpi-label{font-size:12.5px;color:var(--text-secondary);font-weight:520}
  .chip{display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:600;
    padding:2px 7px;border-radius:999px;font-variant-numeric:tabular-nums}
  .chip.up{color:var(--good);background:var(--good-bg)}
  .chip.down-good{color:var(--good);background:var(--good-bg)}
  .chip.bad{color:var(--critical);background:var(--critical-bg)}
  .kpi-val{font-size:27px;font-weight:670;letter-spacing:-0.02em;margin-top:8px}
  .kpi-foot{display:flex;align-items:flex-end;justify-content:space-between;margin-top:6px;gap:10px}
  .kpi-note{font-size:11.5px;color:var(--muted)}
  .spark{width:96px;height:32px;flex:none}
  .spark svg{display:block;width:100%;height:100%;overflow:visible}

  /* Two-column region */
  .grid2{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px}
  .seg{margin-left:auto;display:inline-flex;background:var(--surface-2);
    border:1px solid var(--border);border-radius:9px;padding:2px}
  .seg button{appearance:none;border:0;background:transparent;color:var(--text-secondary);
    font:inherit;font-size:12px;font-weight:560;padding:5px 11px;border-radius:7px;cursor:pointer}
  .seg button[aria-pressed="true"]{background:var(--surface);color:var(--text-primary);
    box-shadow:0 1px 2px rgba(0,0,0,0.12)}
  .legend{display:flex;gap:16px;padding:12px 18px 0;font-size:12px;color:var(--text-secondary)}
  .legend span{display:inline-flex;align-items:center;gap:7px}
  .key{width:11px;height:11px;border-radius:3px;flex:none}
  .chart-wrap{position:relative;padding:8px 12px 6px}
  .chart-wrap svg{display:block;width:100%;height:auto}
  text.ax{fill:var(--muted);font-size:11px;font-family:inherit;font-variant-numeric:tabular-nums}
  .tip{position:absolute;pointer-events:none;opacity:0;transform:translate(-50%,calc(-100% - 14px));
    background:var(--surface);border:1px solid var(--border);border-radius:10px;
    box-shadow:var(--shadow);padding:9px 11px;font-size:12px;min-width:132px;
    transition:opacity .12s ease;z-index:5}
  .tip-h{font-size:11.5px;color:var(--muted);margin-bottom:5px}
  .tip-r{display:flex;align-items:center;gap:7px;color:var(--text-secondary);
    padding:1px 0;font-variant-numeric:tabular-nums}
  .tip-r b{margin-left:auto;color:var(--text-primary);font-weight:620}
  .tip-k{width:9px;height:9px;border-radius:2px;flex:none}

  /* Breakdown bars */
  .bars{padding:16px 18px 18px}
  .bar-row{display:grid;grid-template-columns:74px 1fr auto;align-items:center;gap:12px;
    padding:8px 0;border-radius:8px}
  .bar-name{font-size:12.5px;color:var(--text-secondary)}
  .bar-track{height:14px;background:var(--track);border-radius:0 7px 7px 0;overflow:hidden}
  .bar-fill{height:100%;background:var(--series-1);border-radius:0 4px 4px 0;
    transition:filter .12s ease}
  .bar-row:hover .bar-fill{filter:brightness(1.08)}
  .bar-val{font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--text-primary)}
  .bars-foot{display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;
    border-top:1px solid var(--border);font-size:12px;color:var(--muted)}
  .bars-foot b{color:var(--text-primary);font-weight:620;font-variant-numeric:tabular-nums}

  /* Activity table */
  .tbl-wrap{padding:6px 6px 8px;overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:13px;min-width:560px}
  thead th{text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;
    letter-spacing:0.04em;color:var(--muted);padding:10px 14px}
  tbody td{padding:12px 14px;border-top:1px solid var(--border);color:var(--text-secondary)}
  tbody tr:hover td{background:var(--surface-2)}
  td.cust{color:var(--text-primary);font-weight:560}
  td.amt{text-align:right;font-variant-numeric:tabular-nums;color:var(--text-primary);font-weight:560}
  td.date{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
  .pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:560;
    padding:3px 9px;border-radius:999px}
  .pill .dot{width:7px;height:7px;border-radius:50%;flex:none}
  .pill.good{color:var(--good);background:var(--good-bg)}
  .pill.good .dot{background:var(--good)}
  .pill.warn{color:var(--warning);background:var(--warning-bg)}
  .pill.warn .dot{background:var(--warning)}
  .pill.crit{color:var(--critical);background:var(--critical-bg)}
  .pill.crit .dot{background:var(--critical)}
  .avatar-sm{width:24px;height:24px;border-radius:7px;background:var(--surface-2);
    border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;
    font-size:11px;font-weight:650;color:var(--text-secondary);margin-right:9px;vertical-align:middle}

  @media (max-width:900px){ .grid2{grid-template-columns:1fr} }
  @media (max-width:680px){ .kpis{grid-template-columns:repeat(2,1fr)} }
  @media (max-width:430px){ .kpis{grid-template-columns:1fr} body{padding:16px} }
</style>
</head>
<body>
  <div class="wrap">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 11.5 L5.5 7 L8.5 9.5 L14 3" stroke="#fff" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="brand-name">Metrics</div>
          <div class="brand-sub">Analytics overview</div>
        </div>
      </div>
      <div class="topbar-right">
        <div class="period num">Jul 2026</div>
        <div class="avatar" aria-hidden="true">AR</div>
      </div>
    </header>

    <!-- KPI tiles -->
    <section class="kpis" aria-label="Key metrics">
      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-label">Revenue</span>
          <span class="chip up">&#9650; 12.4%</span>
        </div>
        <div class="kpi-val num">$128.5k</div>
        <div class="kpi-foot">
          <span class="kpi-note">vs. $114.3k last month</span>
          <span class="spark" data-v="92,96,94,101,108,104,112,118,116,122,124,128"></span>
        </div>
      </div>
      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-label">Active users</span>
          <span class="chip up">&#9650; 4.8%</span>
        </div>
        <div class="kpi-val num">8,642</div>
        <div class="kpi-foot">
          <span class="kpi-note">vs. 8,248 last month</span>
          <span class="spark" data-v="74,78,76,80,83,81,84,86,85,87,86,88"></span>
        </div>
      </div>
      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-label">Conversion</span>
          <span class="chip up">&#9650; 0.4pp</span>
        </div>
        <div class="kpi-val num">3.24%</div>
        <div class="kpi-foot">
          <span class="kpi-note">vs. 2.84% last month</span>
          <span class="spark" data-v="27,28,29,28,30,30,31,31,31,32,32,33"></span>
        </div>
      </div>
      <div class="card kpi">
        <div class="kpi-top">
          <span class="kpi-label">Churn</span>
          <span class="chip down-good">&#9660; 0.3pp</span>
        </div>
        <div class="kpi-val num">1.8%</div>
        <div class="kpi-foot">
          <span class="kpi-note">vs. 2.1% last month</span>
          <span class="spark" data-v="26,25,25,24,24,23,22,22,21,20,19,18"></span>
        </div>
      </div>
    </section>

    <!-- Main chart + breakdown -->
    <section class="grid2">
      <div class="card">
        <div class="card-h">
          <div>
            <div class="card-title">Revenue over time</div>
            <div class="card-sub">Monthly recurring revenue, this period vs. last</div>
          </div>
          <div class="seg" role="group" aria-label="Time range">
            <button type="button" data-range="3" aria-pressed="false">3M</button>
            <button type="button" data-range="6" aria-pressed="false">6M</button>
            <button type="button" data-range="12" aria-pressed="true">12M</button>
          </div>
        </div>
        <div class="legend">
          <span><span class="key" style="background:var(--series-1)"></span>This period</span>
          <span><span class="key" style="background:var(--compare)"></span>Last period</span>
        </div>
        <div class="chart-wrap">
          <svg id="lc" viewBox="0 0 720 280" role="img" aria-label="Revenue over time line chart"></svg>
          <div class="tip" id="tip" role="status"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-h">
          <div>
            <div class="card-title">Revenue by channel</div>
            <div class="card-sub">This month</div>
          </div>
        </div>
        <div class="bars">
          <div class="bar-row" title="Direct — $42.8k">
            <span class="bar-name">Direct</span>
            <span class="bar-track"><span class="bar-fill" style="width:100%"></span></span>
            <span class="bar-val num">$42.8k</span>
          </div>
          <div class="bar-row" title="Organic — $31.5k">
            <span class="bar-name">Organic</span>
            <span class="bar-track"><span class="bar-fill" style="width:74%"></span></span>
            <span class="bar-val num">$31.5k</span>
          </div>
          <div class="bar-row" title="Referral — $18.9k">
            <span class="bar-name">Referral</span>
            <span class="bar-track"><span class="bar-fill" style="width:44%"></span></span>
            <span class="bar-val num">$18.9k</span>
          </div>
          <div class="bar-row" title="Social — $12.4k">
            <span class="bar-name">Social</span>
            <span class="bar-track"><span class="bar-fill" style="width:29%"></span></span>
            <span class="bar-val num">$12.4k</span>
          </div>
          <div class="bar-row" title="Email — $8.2k">
            <span class="bar-name">Email</span>
            <span class="bar-track"><span class="bar-fill" style="width:19%"></span></span>
            <span class="bar-val num">$8.2k</span>
          </div>
          <div class="bars-foot">
            <span>Total</span><b class="num">$113.8k</b>
          </div>
        </div>
      </div>
    </section>

    <!-- Activity table -->
    <section class="card">
      <div class="card-h" style="padding-bottom:14px">
        <div>
          <div class="card-title">Recent activity</div>
          <div class="card-sub">Latest transactions across your workspace</div>
        </div>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>Customer</th><th>Plan</th><th style="text-align:right">Amount</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            <tr>
              <td class="cust"><span class="avatar-sm" aria-hidden="true">AC</span>Acme Inc</td>
              <td>Enterprise</td><td class="amt">$4,200</td>
              <td><span class="pill good"><span class="dot"></span>Paid</span></td>
              <td class="date">Jul 18</td>
            </tr>
            <tr>
              <td class="cust"><span class="avatar-sm" aria-hidden="true">GX</span>Globex</td>
              <td>Pro</td><td class="amt">$840</td>
              <td><span class="pill good"><span class="dot"></span>Paid</span></td>
              <td class="date">Jul 18</td>
            </tr>
            <tr>
              <td class="cust"><span class="avatar-sm" aria-hidden="true">IN</span>Initech</td>
              <td>Pro</td><td class="amt">$840</td>
              <td><span class="pill warn"><span class="dot"></span>Pending</span></td>
              <td class="date">Jul 17</td>
            </tr>
            <tr>
              <td class="cust"><span class="avatar-sm" aria-hidden="true">UM</span>Umbrella</td>
              <td>Team</td><td class="amt">$2,100</td>
              <td><span class="pill good"><span class="dot"></span>Paid</span></td>
              <td class="date">Jul 17</td>
            </tr>
            <tr>
              <td class="cust"><span class="avatar-sm" aria-hidden="true">SL</span>Soylent</td>
              <td>Starter</td><td class="amt">$120</td>
              <td><span class="pill crit"><span class="dot"></span>Failed</span></td>
              <td class="date">Jul 16</td>
            </tr>
            <tr>
              <td class="cust"><span class="avatar-sm" aria-hidden="true">WE</span>Wayne Ent.</td>
              <td>Enterprise</td><td class="amt">$4,200</td>
              <td><span class="pill good"><span class="dot"></span>Paid</span></td>
              <td class="date">Jul 16</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

<script>
(function(){
  "use strict";
  // ---- Sparklines (12-point, auto-scaled from each tile's data-v) ----
  function drawSpark(el){
    var raw = el.getAttribute("data-v");
    if(!raw) return;
    var v = raw.split(",").map(Number);
    var w=96, h=32, pad=4;
    var mn=Math.min.apply(null,v), mx=Math.max.apply(null,v), rng=(mx-mn)||1;
    var xs=function(i){ return pad + (w-2*pad)*i/(v.length-1); };
    var ys=function(k){ return pad + (h-2*pad)*(1-(k-mn)/rng); };
    var d="";
    for(var i=0;i<v.length;i++){ d += (i?"L":"M") + xs(i).toFixed(1) + " " + ys(v[i]).toFixed(1); }
    var ex=xs(v.length-1).toFixed(1), ey=ys(v[v.length-1]).toFixed(1);
    el.innerHTML =
      '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" fill="none" aria-hidden="true">' +
      '<path d="'+d+'" stroke="var(--series-1)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>' +
      '<circle cx="'+ex+'" cy="'+ey+'" r="2.4" fill="var(--series-1)" stroke="var(--surface)" stroke-width="1.5"/>' +
      '</svg>';
  }
  var sparks=document.querySelectorAll(".spark");
  for(var s=0;s<sparks.length;s++){ drawSpark(sparks[s]); }

  // ---- Main time-series (two series, crosshair + tooltip, functional range) ----
  var MONTHS=["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
  var CUR=[72,78,74,85,92,88,99,108,104,116,121,128];
  var PREV=[60,63,65,68,70,74,77,80,83,88,92,96];
  var W=720, H=280, PL=48, PR=20, PT=18, PB=32;
  var plotW=W-PL-PR, plotH=H-PT-PB;
  var YMAX=160, TICKS=[0,40,80,120,160];
  var svg=document.getElementById("lc");
  var tip=document.getElementById("tip");
  var wrap=svg.parentElement;
  var cur=[], prv=[], mon=[], n=12;

  function xAt(i){ return PL + (n<=1 ? plotW/2 : plotW*i/(n-1)); }
  function yAt(val){ return PT + plotH*(1 - val/YMAX); }
  function money(val){ return "$" + val + "k"; }
  function line(arr){ var d=""; for(var i=0;i<arr.length;i++){ d += (i?"L":"M") + xAt(i).toFixed(1) + " " + yAt(arr[i]).toFixed(1); } return d; }

  function render(range){
    n = range;
    cur = CUR.slice(12-n); prv = PREV.slice(12-n); mon = MONTHS.slice(12-n);
    var p=[];
    for(var t=0;t<TICKS.length;t++){
      var gy=yAt(TICKS[t]).toFixed(1);
      p.push('<line x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'" stroke="var(--grid)" stroke-width="1"/>');
      p.push('<text x="'+(PL-9)+'" y="'+(yAt(TICKS[t])+4).toFixed(1)+'" text-anchor="end" class="ax">'+(TICKS[t]===0?"0":TICKS[t]+"k")+'</text>');
    }
    for(var i=0;i<mon.length;i++){
      p.push('<text x="'+xAt(i).toFixed(1)+'" y="'+(H-11)+'" text-anchor="middle" class="ax">'+mon[i]+'</text>');
    }
    // last period (neutral reference line)
    p.push('<path d="'+line(prv)+'" fill="none" stroke="var(--compare)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>');
    // this period (accent) with area wash
    var cd=line(cur);
    var area=cd + "L" + xAt(cur.length-1).toFixed(1) + " " + (PT+plotH) + "L" + xAt(0).toFixed(1) + " " + (PT+plotH) + "Z";
    p.push('<path d="'+area+'" fill="var(--series-1-wash)" stroke="none"/>');
    p.push('<path d="'+cd+'" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>');
    var ex=xAt(cur.length-1).toFixed(1), ey=yAt(cur[cur.length-1]).toFixed(1);
    p.push('<circle cx="'+ex+'" cy="'+ey+'" r="4.5" fill="var(--series-1)" stroke="var(--surface)" stroke-width="2"/>');
    // hover marks (hidden until move)
    p.push('<line id="cx" x1="0" y1="'+PT+'" x2="0" y2="'+(PT+plotH)+'" stroke="var(--axis)" stroke-width="1" opacity="0"/>');
    p.push('<circle id="cd2" r="4" fill="var(--compare)" stroke="var(--surface)" stroke-width="2" opacity="0"/>');
    p.push('<circle id="cd1" r="4.5" fill="var(--series-1)" stroke="var(--surface)" stroke-width="2" opacity="0"/>');
    p.push('<rect id="hit" x="'+PL+'" y="'+PT+'" width="'+plotW+'" height="'+plotH+'" fill="transparent" style="cursor:crosshair"/>');
    svg.innerHTML=p.join("");
    bindHover();
  }

  function bindHover(){
    var hit=document.getElementById("hit");
    var cx=document.getElementById("cx");
    var cd1=document.getElementById("cd1");
    var cd2=document.getElementById("cd2");
    function nearest(clientX){
      var r=svg.getBoundingClientRect();
      var mx=(clientX-r.left)*(W/r.width);
      var best=0, bd=1e9;
      for(var i=0;i<cur.length;i++){ var d=Math.abs(xAt(i)-mx); if(d<bd){ bd=d; best=i; } }
      return best;
    }
    function move(clientX){
      var i=nearest(clientX);
      var px=xAt(i);
      cx.setAttribute("x1",px); cx.setAttribute("x2",px); cx.setAttribute("opacity","1");
      cd1.setAttribute("cx",px); cd1.setAttribute("cy",yAt(cur[i])); cd1.setAttribute("opacity","1");
      cd2.setAttribute("cx",px); cd2.setAttribute("cy",yAt(prv[i])); cd2.setAttribute("opacity","1");
      tip.innerHTML =
        '<div class="tip-h">'+mon[i]+' 2026</div>' +
        '<div class="tip-r"><span class="tip-k" style="background:var(--series-1)"></span>This period<b>'+money(cur[i])+'</b></div>' +
        '<div class="tip-r"><span class="tip-k" style="background:var(--compare)"></span>Last period<b>'+money(prv[i])+'</b></div>';
      var r=svg.getBoundingClientRect();
      var host=wrap.getBoundingClientRect();
      tip.style.left=((r.left-host.left) + px*(r.width/W))+"px";
      tip.style.top=((r.top-host.top) + yAt(cur[i])*(r.height/H))+"px";
      tip.style.opacity="1";
    }
    hit.addEventListener("mousemove", function(e){ move(e.clientX); });
    hit.addEventListener("mouseleave", function(){
      cx.setAttribute("opacity","0"); cd1.setAttribute("opacity","0"); cd2.setAttribute("opacity","0");
      tip.style.opacity="0";
    });
  }

  var btns=document.querySelectorAll("[data-range]");
  for(var b=0;b<btns.length;b++){
    btns[b].addEventListener("click", function(e){
      var t=e.currentTarget;
      for(var k=0;k<btns.length;k++){ btns[k].setAttribute("aria-pressed","false"); }
      t.setAttribute("aria-pressed","true");
      render(parseInt(t.getAttribute("data-range"),10));
    });
  }
  render(12);
})();
</script>
</body>
</html>`;
