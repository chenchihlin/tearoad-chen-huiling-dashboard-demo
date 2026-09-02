const snapshot = window.DEMO_PERIOD_SNAPSHOT;
const demo = window.DEMO_DATA;
const state = { period: "month", view: "overview" };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function money(value, currency = "TWD") {
  const number = Number(value || 0);
  if (currency === "USD") return `US$${number.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `NT$${Math.round(number).toLocaleString("zh-TW")}`;
}

function compact(value) {
  return Number(value || 0).toLocaleString("zh-TW", { notation: "compact", maximumFractionDigits: 1 });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function shortDate(value, grain = "day") {
  const raw = String(value || "");
  if (grain === "month") return raw.slice(2).replace("-", "/");
  return raw.slice(5).replace("-", "/");
}

function displayDate(value) {
  const raw = String(value || "");
  if (!raw) return "尚無資料";
  const parsed = new Date(raw.includes("T") ? raw : `${raw}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", hour: raw.includes("T") ? "2-digit" : undefined, minute: raw.includes("T") ? "2-digit" : undefined, hour12: false }).format(parsed);
}

function activePeriod() {
  return snapshot.periods[state.period];
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
}

function switchView(view) {
  state.view = view;
  const titles = { overview: "營運儀表板", orders: "訂單", ads: "廣告表現", advice: "改善建議" };
  $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  $$(".view").forEach((section) => section.classList.toggle("is-active", section.id === `${view}-view`));
  $("#view-title").textContent = titles[view];
  if (view === "advice") renderRecommendations();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectPeriod(periodKey) {
  if (!snapshot.periods[periodKey]) return;
  state.period = periodKey;
  $$("[data-period]").forEach((button) => button.classList.toggle("is-active", button.dataset.period === periodKey));
  renderPeriod();
}

function kpi(label, value, note, featured = false) {
  return `<article class="kpi-card${featured ? " featured" : ""}"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><small>${escapeHTML(note)}</small></article>`;
}

function renderPeriod() {
  const period = activePeriod();
  const orders = period.orders;
  const ads = period.ads.totals;
  $("#overview-kpis").innerHTML = [
    kpi("有效營業額", money(orders.revenue), period.label, true),
    kpi("有效訂單", `${orders.order_count.toLocaleString("zh-TW")} 筆`, orders.cancelled_count ? `另有 ${orders.cancelled_count} 筆取消單` : "沒有取消單"),
    kpi("平均客單", money(orders.average_order_value), "營業額 ÷ 有效訂單"),
    kpi("Meta 花費", money(ads.spend_usd, "USD"), "廣告帳號幣別為美元")
  ].join("");
  $("#freshness-bar").textContent = `最新訂單：${displayDate(snapshot.freshness.latest_order_date)}｜1Shop 同步：${displayDate(snapshot.freshness.orders_fetched_at)}｜Meta 同步：${displayDate(snapshot.freshness.meta_fetched_at)}`;
  $("#revenue-period").textContent = period.label;
  $("#revenue-chart-title").textContent = period.trend.grain === "month" ? "每個月賣了多少" : "每天賣了多少";
  renderRevenueChart(period);
  renderProductChart(period);
  renderFocus(period);
  renderAds(period);
  renderDecisionReadiness();
  renderRecommendations();
}

function completeRows(rows, start, end, grain, fields) {
  const byPeriod = new Map(rows.map((row) => [row.period, row]));
  const result = [];
  if (grain === "month") {
    let [year, month] = start.slice(0, 7).split("-").map(Number);
    const endKey = end.slice(0, 7);
    while (true) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      result.push({ period: key, ...Object.fromEntries(fields.map((field) => [field, Number(byPeriod.get(key)?.[field] || 0)])) });
      if (key === endKey) break;
      month += 1;
      if (month === 13) { year += 1; month = 1; }
    }
    return result;
  }
  let cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ period: key, ...Object.fromEntries(fields.map((field) => [field, Number(byPeriod.get(key)?.[field] || 0)])) });
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return result;
}

function renderRevenueChart(period) {
  const rows = completeRows(period.trend.rows, period.date_range.start, period.date_range.end, period.trend.grain, ["revenue", "order_count"]);
  const container = $("#revenue-chart");
  if (!rows.length || rows.every((row) => !row.revenue)) {
    container.innerHTML = `<div class="empty-state">${escapeHTML(period.label)}還沒有有效訂單。</div>`;
    return;
  }
  const width = 820, height = 280;
  const pad = { left: 58, right: 18, top: 28, bottom: 48 };
  const chartW = width - pad.left - pad.right, chartH = height - pad.top - pad.bottom;
  const max = Math.max(...rows.map((row) => row.revenue), 1);
  const points = rows.map((row, index) => ({
    x: pad.left + (rows.length === 1 ? chartW / 2 : index / (rows.length - 1) * chartW),
    y: pad.top + chartH - row.revenue / max * chartH,
    row
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${pad.left},${pad.top + chartH} ${line} ${pad.left + chartW},${pad.top + chartH}`;
  const grid = [0, .25, .5, .75, 1].map((ratio) => {
    const y = pad.top + chartH - ratio * chartH;
    return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}"/><text x="${pad.left - 9}" y="${y + 4}" text-anchor="end">${compact(max * ratio)}</text>`;
  }).join("");
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6));
  const labels = points.map((point, index) => index % labelEvery === 0 || index === points.length - 1 ? `<text x="${point.x}" y="${height - 15}" text-anchor="middle">${shortDate(point.row.period, period.trend.grain)}</text>` : "").join("");
  const dots = points.filter((point) => point.row.revenue > 0).map((point) => `<circle cx="${point.x}" cy="${point.y}" r="5"><title>${point.row.period}｜${money(point.row.revenue)}｜${point.row.order_count} 筆</title></circle>`).join("");
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(period.label)}營業額趨勢"><g class="chart-grid">${grid}</g><polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/><g class="chart-dots">${dots}</g><g class="chart-labels">${labels}</g></svg><div class="chart-legend"><span><i></i>${escapeHTML(period.label)}有效營業額</span><strong>${ordersSummary(period)}</strong></div>`;
}

function ordersSummary(period) {
  return `${period.orders.order_count.toLocaleString("zh-TW")} 筆・${money(period.orders.revenue)}`;
}

function cleanProductName(name) {
  return String(name || "")
    .replace(/^\[預購\]/, "")
    .replace(/陳惠玲/g, "")
    .replace(/\s*20\d{2}\/\d{2}\/\d{2}開始出貨.*$/, "")
    .trim() || "未命名商品";
}

function renderProductChart(period) {
  const container = $("#product-chart");
  const total = Number(period.product_total_quantity || 0);
  if (!total || !period.top_products.length) {
    container.innerHTML = `<div class="empty-state">${escapeHTML(period.label)}還沒有商品資料。</div>`;
    return;
  }
  const rows = period.top_products.slice(0, 4).map((row) => ({ name: cleanProductName(row.product_name), quantity: Number(row.quantity), revenue: Number(row.revenue) }));
  const shown = rows.reduce((sum, row) => sum + row.quantity, 0);
  if (total - shown > .01) rows.push({ name: "其他付費商品", quantity: total - shown, revenue: 0 });
  const colors = ["#236b55", "#77a993", "#d19248", "#dfbd86", "#aab5af"];
  let offset = 0;
  const segments = rows.map((row, index) => {
    const share = row.quantity / total * 100;
    const svg = `<circle cx="80" cy="80" r="52" pathLength="100" stroke="${colors[index]}" stroke-dasharray="${share} ${100 - share}" stroke-dashoffset="${-offset}"><title>${escapeHTML(row.name)} ${row.quantity.toLocaleString("zh-TW")} 件</title></circle>`;
    offset += share;
    return svg;
  }).join("");
  const legend = rows.slice(0, 4).map((row, index) => `<div class="legend-row"><i style="background:${colors[index]}"></i><div><strong>${escapeHTML(row.name)}</strong><span>${row.quantity.toLocaleString("zh-TW")} 件${row.revenue ? `・${money(row.revenue)}` : ""}</span></div></div>`).join("");
  container.innerHTML = `<svg viewBox="0 0 160 160" role="img" aria-label="${escapeHTML(period.label)}商品銷售件數占比"><circle class="donut-base" cx="80" cy="80" r="52" pathLength="100"/>${segments}<text class="donut-value" x="80" y="76" text-anchor="middle">${total.toLocaleString("zh-TW")}</text><text class="donut-label" x="80" y="97" text-anchor="middle">付費商品件數</text></svg><div class="product-legend">${legend}</div>`;
}

function renderFocus(period) {
  const top = period.top_products[0];
  const ads = period.ads.totals;
  if (!period.orders.order_count) {
    $("#focus-title").textContent = `${period.label}先確認沒有漏接訂單`;
    $("#focus-copy").textContent = "目前沒有有效訂單。先確認頁面連結與廣告是否正常，再決定是否調整素材。";
    return;
  }
  $("#focus-title").textContent = `${period.label}先延續「${cleanProductName(top?.product_name)}」的需求`;
  $("#focus-copy").textContent = `${period.label}有 ${period.orders.order_count} 筆有效訂單、營業額 ${money(period.orders.revenue)}；Meta 記錄 ${Number(ads.purchases || 0).toLocaleString("zh-TW")} 次歸因購買。兩者口徑不同，不直接視為同一批訂單。`;
}

function renderAds(period) {
  const ads = period.ads.totals;
  $("#ad-kpis").innerHTML = [
    kpi("廣告花費", money(ads.spend_usd, "USD"), period.label, true),
    kpi("Meta 購買", `${Number(ads.purchases || 0).toLocaleString("zh-TW")} 次`, "平台歸因購買"),
    kpi("每次購買", ads.cost_per_purchase_usd == null ? "—" : money(ads.cost_per_purchase_usd, "USD"), "花費 ÷ Meta 購買"),
    kpi("點擊率", `${Number(ads.ctr || 0).toFixed(2)}%`, `${Number(ads.clicks || 0).toLocaleString("zh-TW")} 次點擊`)
  ].join("");
  $("#ads-source-note").textContent = `${period.label}為 ${period.date_range.start.replaceAll("-", "/")}–${period.date_range.end.replaceAll("-", "/")}。廣告費是美元、營業額是新台幣，匯率完成前不混算 ROAS。`;
  const stages = [
    ["曝光", ads.impressions], ["連結點擊", ads.link_clicks], ["到達頁面", ads.landing_page_views],
    ["加入購物車", ads.add_to_carts], ["開始結帳", ads.checkouts], ["Meta 購買", ads.purchases]
  ];
  const max = Math.max(Number(stages[0][1] || 0), 1);
  $("#ad-funnel").innerHTML = stages.map(([label, value]) => `<div class="funnel-row"><span>${label}</span><div><i style="width:${Math.max(1.5, Math.sqrt(Number(value || 0) / max) * 100)}%"></i></div><strong>${Number(value || 0).toLocaleString("zh-TW")}</strong></div>`).join("");
  $("#ad-trend-period").textContent = period.label;
  $("#ad-trend-title").textContent = period.ads.trend.grain === "month" ? "每月花費與 Meta 購買" : "每天花費與 Meta 購買";
  renderAdTrend(period);
}

function renderAdTrend(period) {
  const trend = period.ads.trend;
  const rows = completeRows(trend.rows, period.date_range.start, period.date_range.end, trend.grain, ["spend_usd", "purchases"]);
  const container = $("#ad-trend-chart");
  if (!rows.length || rows.every((row) => !row.spend_usd && !row.purchases)) {
    container.innerHTML = `<div class="empty-state">${escapeHTML(period.label)}沒有廣告資料。</div>`;
    return;
  }
  const width = 820, height = 292;
  const pad = { left: 52, right: 20, bottom: 44 };
  const chartW = width - pad.left - pad.right;
  const step = chartW / rows.length;
  const maxSpend = Math.max(...rows.map((row) => row.spend_usd), 1);
  const maxPurchases = Math.max(...rows.map((row) => row.purchases), 1);
  const spendBase = 130;
  const bars = rows.map((row, index) => {
    const x = pad.left + index * step + step * .18;
    const barHeight = row.spend_usd / maxSpend * 90;
    return `<rect x="${x}" y="${spendBase - barHeight}" width="${Math.max(3, step * .64)}" height="${barHeight}" rx="3"><title>${row.period}｜花費 ${money(row.spend_usd, "USD")}</title></rect>`;
  }).join("");
  const points = rows.map((row, index) => ({ x: pad.left + index * step + step / 2, y: 243 - row.purchases / maxPurchases * 78, row }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const dots = points.filter((point) => point.row.purchases > 0).map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4"><title>${point.row.period}｜${point.row.purchases} 次購買</title></circle>`).join("");
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6));
  const labels = rows.map((row, index) => (index % labelEvery === 0 || index === rows.length - 1) ? `<text x="${pad.left + index * step + step / 2}" y="${height - 14}" text-anchor="middle">${shortDate(row.period, trend.grain)}</text>` : "").join("");
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(period.label)}廣告花費與 Meta 購買"><text class="mini-title" x="${pad.left}" y="20">廣告花費（美元）</text><line class="section-line" x1="${pad.left}" y1="${spendBase}" x2="${width - pad.right}" y2="${spendBase}"/><g class="ad-bars">${bars}</g><text class="mini-title" x="${pad.left}" y="157">Meta 購買（次）</text><polyline class="ad-line" points="${line}"/><g class="ad-dots">${dots}</g><g class="chart-labels">${labels}</g></svg>`;
}

function currentOrderStatus(order) {
  return sessionStorage.getItem(`demo-order-${order.id}`) || order.status;
}

function renderOrders() {
  const pending = demo.sampleOrders.filter((order) => currentOrderStatus(order) === "pending").length;
  $("#pending-count").textContent = `${pending} 筆待處理`;
  $("#order-list").innerHTML = demo.sampleOrders.map((order) => {
    const status = currentOrderStatus(order);
    return `<article class="order-card"><div class="order-top"><div><span>${escapeHTML(order.date)}</span><strong>${escapeHTML(order.id)}</strong></div><span class="work-pill ${status}">${status === "pending" ? "待處理" : "已處理"}</span></div><div class="order-product"><span aria-hidden="true">🍃</span><div><strong>${escapeHTML(order.product)}</strong><small>${order.quantity} 件・${escapeHTML(order.customer)}</small></div><b>${money(order.amount)}</b></div><div class="order-meta"><span>${escapeHTML(order.payment)}</span><span>${escapeHTML(order.delivery)}</span></div><button class="order-detail-button" data-order-id="${escapeHTML(order.id)}">查看出貨資料</button></article>`;
  }).join("");
}

function openOrder(orderId) {
  const order = demo.sampleOrders.find((item) => item.id === orderId);
  if (!order) return;
  const status = currentOrderStatus(order);
  $("#dialog-title").textContent = order.id;
  $("#order-detail").innerHTML = `<div class="detail-warning">這是虛構示範資料，不是真實顧客。</div><div class="detail-grid"><div><span>收件人</span><strong>${escapeHTML(order.customer)}</strong></div><div><span>電話</span><strong>${escapeHTML(order.phone)}</strong></div><div class="wide"><span>地址</span><strong>${escapeHTML(order.city)}</strong></div><div><span>付款</span><strong>${escapeHTML(order.payment)}</strong></div><div><span>配送</span><strong>${escapeHTML(order.delivery)}</strong></div><div class="wide"><span>商品</span><strong>${escapeHTML(order.product)} × ${order.quantity}</strong></div></div><button class="primary-button dialog-status" data-order-id="${escapeHTML(order.id)}">${status === "pending" ? "標記為已處理" : "改回待處理"}</button>`;
  $("#order-dialog").showModal();
}

function percentage(numerator, denominator) {
  return Number(denominator || 0) ? Number(numerator || 0) / Number(denominator) * 100 : null;
}

function formatRate(value) {
  return value == null ? "無法計算" : `${value.toFixed(1)}%`;
}

function renderDecisionReadiness() {
  const period = activePeriod();
  const ads = period.ads.totals;
  const items = [
    {
      status: "pass", label: "1Shop 訂單營業額", verdict: "可作為實際成交依據",
      note: `${period.label}有 ${period.orders.order_count} 筆有效訂單；取消單已分開計算。`
    },
    {
      status: "directional", label: "Meta 投放與漏斗", verdict: "可用來找投放問題",
      note: `${period.label}有 ${Number(ads.impressions || 0).toLocaleString("zh-TW")} 次曝光、${Number(ads.purchases || 0).toLocaleString("zh-TW")} 次平台歸因購買。`
    },
    {
      status: "unknown", label: "真實回本與擴量", verdict: "目前不能判斷",
      note: "尚未對上同一筆訂單、逐日匯率、茶農成本與可承受獲客成本。"
    }
  ];
  $("#decision-readiness").innerHTML = `<div class="readiness-heading"><span class="eyebrow">先看資料能不能用</span><h3>這些數字現在能做什麼</h3><p>綠色可直接採用；黃色只能看方向；灰色代表還要補資料。</p></div><div class="readiness-list">${items.map((item) => `<div class="readiness-row"><span class="readiness-dot ${item.status}" aria-hidden="true"></span><div><strong>${escapeHTML(item.label)}</strong><p>${escapeHTML(item.note)}</p></div><b class="readiness-verdict ${item.status}">${escapeHTML(item.verdict)}</b></div>`).join("")}</div>`;
}

function periodRecommendation() {
  const period = activePeriod();
  const ads = period.ads.totals;
  const purchases = Number(ads.purchases || 0);
  const cost = ads.cost_per_purchase_usd;
  const common = {
    id: `period-${state.period}`, icon: "📣", category: "廣告診斷",
    target: `Meta 活動「${snapshot.campaign.name}」・${period.label}`,
    owner: "茶路掌門", qualityStatus: "directional", quality: "方向性",
    review: "完整觀察 7 天後"
  };
  if (!ads.spend_usd) {
    return {
      ...common, priority: "先查原因", confidence: "低", qualityStatus: "unknown", quality: "資料不足",
      title: `${period.label}沒有廣告花費，先確認投放是否正常`,
      evidence: `${period.label} Meta 花費為 US$0.00，也沒有歸因購買。`,
      reason: "空白資料只能證明這段期間沒有記錄到投放，不能直接判斷素材或商品不好。",
      alternative: "活動可能尚未排程、被關閉、預算未送出，也可能是同步來源中斷。",
      steps: ["請茶路確認活動狀態與排程", "確認付款、預算與帳號是否受限", "同步恢復後累積一個完整觀察期"],
      guardrail: "資料恢復前不新增預算、不停用其他活動，也不把零值當成成效失敗。",
      success: "連續 7 天都能取得花費、曝光、點擊與轉換資料。"
    };
  }
  if (!purchases) {
    return {
      ...common, priority: "先查追蹤", confidence: "低", qualityStatus: "unknown", quality: "購買事件待確認",
      title: "有花費但沒有 Meta 購買，先排除追蹤問題",
      evidence: `${period.label}花費 ${money(ads.spend_usd, "USD")}、${Number(ads.link_clicks || 0).toLocaleString("zh-TW")} 次連結點擊，但 Meta 購買為 0。`,
      reason: "問題可能出在廣告、銷售頁或 Purchase 事件；先把資料量對，才有資格討論預算。",
      alternative: "也可能只是觀察期太短、購買延遲，或點擊者尚未完成訂單。",
      steps: ["用一筆測試流程確認到站、加購、結帳與購買事件", "比對同日期的 1Shop 有效訂單", "追蹤正常後再拆看素材與頁面"],
      guardrail: "追蹤未確認前不自動加預算，也不因 Meta 顯示 0 就直接停掉全部廣告。",
      success: "完成端到端事件測試，並能解釋 Meta 與 1Shop 的差異。",
      review: "追蹤檢查完成後 24 小時"
    };
  }
  const confidence = purchases < 5 ? "低" : "中";
  return {
    ...common, priority: purchases < 5 ? "先累積資料" : "先訂成本界線", confidence,
    title: purchases < 5 ? "先累積完整觀察期，再討論加預算" : "廣告有帶來購買，但現在還不能說賺不賺",
    evidence: `${period.label}花費 ${money(ads.spend_usd, "USD")}、Meta 歸因購買 ${purchases} 次，每次購買 ${cost == null ? "尚無法計算" : money(cost, "USD")}；1Shop 同期有 ${period.orders.order_count} 筆有效訂單。`,
    reason: "Meta 購買與 1Shop 訂單不是同一套口徑，而且目前沒有茶農成本與可承受 CPA，所以不能把每次購買成本直接判定為好或壞。",
    alternative: "兩邊差異可能來自瀏覽歸因、回看期間、跨裝置、重複事件或訂單時間不同。",
    steps: ["茶路先比對每日 Meta 購買與 1Shop 訂單走勢", "記錄目前預算、素材與每次購買成本作為基準", "茶農可提供一筆訂單可接受的廣告成本範圍，再討論擴量"],
    guardrail: "目前不直接提高預算、不把平台購買當成實際訂單，也不以營業額代替獲利。",
    success: "完成至少一個完整 7 天觀察期，並設定可承受的每次購買成本後，再與掌門決定是否調整預算。"
  };
}

function creativeTestRecommendation() {
  const period = activePeriod();
  const ads = period.ads.totals;
  const topProduct = cleanProductName(period.top_products[0]?.product_name || "主要商品");
  const landingRate = percentage(ads.landing_page_views, ads.link_clicks);
  const cartRate = percentage(ads.add_to_carts, ads.landing_page_views);
  const hasLearningSample = Number(ads.link_clicks || 0) >= 100 && Number(ads.purchases || 0) >= 5;
  return {
    id: `creative-${state.period}`, icon: "🧪", category: "素材測試", priority: "準備下一輪",
    confidence: hasLearningSample ? "中" : "低", quality: "需補單則素材資料", qualityStatus: "unknown",
    target: `${topProduct}・Meta 活動「${snapshot.campaign.name}」`,
    title: `用兩個真正不同的角度測「${topProduct}」`,
    evidence: `${period.label}有 ${Number(ads.link_clicks || 0).toLocaleString("zh-TW")} 次連結點擊、${Number(ads.landing_page_views || 0).toLocaleString("zh-TW")} 次到站、${Number(ads.add_to_carts || 0).toLocaleString("zh-TW")} 次加購；點擊到到站 ${formatRate(landingRate)}、到站到加購 ${formatRate(cartRate)}。目前只有活動總計，還不知道是哪一則素材帶來結果。`,
    reason: "下一輪應該先測不同的購買理由，而不是只換顏色或同義字。這張卡是探索提案，不是假裝已經找到贏家。",
    alternative: "點擊後流失也可能來自頁面速度、商品說明、價格、結帳或連結不一致，不一定全是素材。",
    steps: [
      "A｜人物與選擇：由陳惠玲回答『做這款茶時最在意哪一個選擇？』，只使用本人確認的事實",
      "B｜第一次怎麼選：用春茶與冬茶的已確認差異，幫第一次購買的人判斷適合哪一款",
      "固定同一受眾、預算、優惠與銷售頁，只更換主要角度與第一句鉤子",
      "命名保留角度、鉤子、格式與版本，讓成效可以回推到真正的差異"
    ],
    guardrail: "不製造假心得、假稀缺、療效或未確認風味；測試期間不一起更換受眾、預算、優惠與頁面。",
    success: "兩個版本各跑滿 7 天並取得可比較的到站量；同時看加購率與每次購買成本。樣本不足就標記『還不能判斷』，不提前宣布贏家。",
    owner: "陳惠玲確認事實・茶路製作與投放", review: "兩版都完成 7 天後"
  };
}

function recommendationStatus(id) {
  return sessionStorage.getItem(`demo-recommendation-${id}`) || "new";
}

function renderRecommendations() {
  const renderCard = (item) => {
    const status = recommendationStatus(item.id);
    const qualityStatus = ["pass", "directional", "unknown"].includes(item.qualityStatus) ? item.qualityStatus : "unknown";
    const confidenceClass = item.confidence === "高" ? "high" : item.confidence === "中" ? "medium" : "low";
    return `<article class="recommendation-card ${qualityStatus}"><div class="recommendation-top"><span class="recommendation-icon" aria-hidden="true">${item.icon}</span><div class="recommendation-chips"><span>${escapeHTML(item.category)}</span><b>${escapeHTML(item.priority)}</b><em class="confidence ${confidenceClass}">${escapeHTML(item.confidence || "低")}信心</em></div></div><h3>${escapeHTML(item.title)}</h3><div class="recommendation-target"><span>判斷對象</span><strong>${escapeHTML(item.target || "目前選擇的資料期間")}</strong></div><div class="evidence"><div><span>資料根據</span><b class="quality-chip ${qualityStatus}">${escapeHTML(item.quality || "待確認")}</b></div><p>${escapeHTML(item.evidence)}</p></div><p class="reason"><strong>目前判斷：</strong>${escapeHTML(item.reason)}</p>${item.alternative ? `<p class="alternative"><strong>也可能是：</strong>${escapeHTML(item.alternative)}</p>` : ""}<div class="steps"><span>建議做法</span><ol>${item.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol></div>${item.guardrail ? `<div class="guardrail"><span>先不要做</span><p>${escapeHTML(item.guardrail)}</p></div>` : ""}<div class="success"><span>完成與停止條件</span><p>${escapeHTML(item.success)}</p></div><div class="recommendation-meta"><span><b>負責：</b>${escapeHTML(item.owner || "茶路掌門")}</span><span><b>再檢查：</b>${escapeHTML(item.review || "7 天後")}</span></div><div class="recommendation-actions">${status === "new" ? `<button class="accept-button" data-decision="accepted" data-id="${item.id}">接受，聯絡掌門</button><button class="skip-button" data-decision="skipped" data-id="${item.id}">先略過</button>` : `<strong>${status === "accepted" ? "✓ 已接受，請聯絡茶路掌門" : "已略過，可隨時重新評估"}</strong><button class="reset-button" data-decision="new" data-id="${item.id}">復原</button>`}</div></article>`;
  };
  const immediate = [periodRecommendation(), creativeTestRecommendation()];
  $("#recommendation-list").innerHTML = `<div class="recommendation-group-heading"><span class="eyebrow">這期先做</span><h3>先處理會影響廣告決定的兩件事</h3><p>依你上方選擇的期間更新。</p></div>${immediate.map(renderCard).join("")}<div class="recommendation-group-heading long-term"><span class="eyebrow">品牌長期做</span><h3>把旺季成果變成可重複的方法</h3><p>以近一年訂單為主要依據，不會跟著短期波動改變。</p></div>${demo.recommendations.map(renderCard).join("")}`;
}

document.addEventListener("click", (event) => {
  const periodButton = event.target.closest("[data-period]");
  if (periodButton) selectPeriod(periodButton.dataset.period);
  const nav = event.target.closest("[data-view]");
  if (nav) switchView(nav.dataset.view);
  const go = event.target.closest("[data-go-view]");
  if (go) switchView(go.dataset.goView);
  const orderButton = event.target.closest("[data-order-id]");
  if (orderButton && !orderButton.classList.contains("dialog-status")) openOrder(orderButton.dataset.orderId);
  const statusButton = event.target.closest(".dialog-status");
  if (statusButton) {
    const order = demo.sampleOrders.find((item) => item.id === statusButton.dataset.orderId);
    const next = currentOrderStatus(order) === "pending" ? "processed" : "pending";
    sessionStorage.setItem(`demo-order-${order.id}`, next);
    $("#order-dialog").close();
    renderOrders();
    toast(next === "processed" ? "已在這次試看中標記為已處理" : "已改回待處理");
  }
  const decision = event.target.closest("[data-decision]");
  if (decision) {
    if (decision.dataset.decision === "new") sessionStorage.removeItem(`demo-recommendation-${decision.dataset.id}`);
    else sessionStorage.setItem(`demo-recommendation-${decision.dataset.id}`, decision.dataset.decision);
    renderRecommendations();
    toast(decision.dataset.decision === "accepted" ? "已接受，正式版會通知茶路掌門" : "已更新這次試看的狀態");
  }
});

$("#dialog-close").addEventListener("click", () => $("#order-dialog").close());
renderOrders();
selectPeriod("month");
