const data = window.DEMO_DATA;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function money(value, currency = "TWD") {
  if (currency === "USD") return `US$${Number(value).toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `NT$${Math.round(value).toLocaleString("zh-TW")}`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
}

function switchView(view) {
  const titles = { overview: "營運儀表板", orders: "訂單", ads: "廣告表現", advice: "改善建議" };
  $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  $$(".view").forEach((section) => section.classList.toggle("is-active", section.id === `${view}-view`));
  $("#view-title").textContent = titles[view];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderKpis() {
  const kpis = [
    ["有效營業額", money(data.orders.revenue), "已排除 5 筆取消單", true],
    ["有效訂單", `${data.orders.orderCount} 筆`, `全部訂單 ${data.orders.totalOrderCount} 筆`],
    ["平均客單", money(data.orders.averageOrderValue), "營業額 ÷ 有效訂單"],
    ["最高月份", money(91145), "2026 年 5 月"]
  ];
  $("#overview-kpis").innerHTML = kpis.map(([label, value, note, featured]) => `<article class="kpi-card${featured ? " featured" : ""}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  const ad = data.ads;
  const ctr = ad.impressions ? ad.clicks / ad.impressions * 100 : 0;
  const costPerPurchase = ad.purchases ? ad.spendUsd / ad.purchases : 0;
  $("#ad-kpis").innerHTML = [
    ["廣告花費", money(ad.spendUsd, "USD"), "近一年", true],
    ["Meta 購買", `${ad.purchases} 次`, "平台歸因購買"],
    ["每次購買", money(costPerPurchase, "USD"), "花費 ÷ Meta 購買"],
    ["點擊率", `${ctr.toFixed(2)}%`, `${ad.clicks.toLocaleString("zh-TW")} 次點擊`]
  ].map(([label, value, note, featured]) => `<article class="kpi-card${featured ? " featured" : ""}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
}

function renderRevenueChart() {
  const rows = data.monthly;
  const width = 820, height = 280;
  const pad = { left: 58, right: 18, top: 28, bottom: 48 };
  const chartW = width - pad.left - pad.right, chartH = height - pad.top - pad.bottom;
  const max = Math.max(...rows.map((row) => row.revenue));
  const points = rows.map((row, index) => ({
    x: pad.left + index / (rows.length - 1) * chartW,
    y: pad.top + chartH - row.revenue / max * chartH,
    row
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${pad.left},${pad.top + chartH} ${line} ${pad.left + chartW},${pad.top + chartH}`;
  const grid = [0, .25, .5, .75, 1].map((ratio) => {
    const y = pad.top + chartH - ratio * chartH;
    return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}"/><text x="${pad.left - 9}" y="${y + 4}" text-anchor="end">${Math.round(max * ratio / 1000)}k</text>`;
  }).join("");
  const labels = points.map((point, index) => index % 2 === 0 || index === points.length - 1 ? `<text x="${point.x}" y="${height - 15}" text-anchor="middle">${point.row.month.slice(2).replace("-", "/")}</text>` : "").join("");
  const dots = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="5"><title>${point.row.month}｜${money(point.row.revenue)}｜${point.row.orders} 筆</title></circle>`).join("");
  $("#revenue-chart").innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="近一年每月營業額趨勢"><g class="chart-grid">${grid}</g><polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/><g class="chart-dots">${dots}</g><g class="chart-labels">${labels}</g></svg><div class="chart-legend"><span><i></i>每月有效營業額</span><strong>最高：2026 年 5 月</strong></div>`;
}

function renderProductChart() {
  const rows = data.products;
  const total = rows.reduce((sum, row) => sum + row.quantity, 0);
  const colors = ["#236b55", "#77a993", "#d19248", "#dfbd86", "#aab5af"];
  let offset = 0;
  const segments = rows.map((row, index) => {
    const share = row.quantity / total * 100;
    const svg = `<circle cx="80" cy="80" r="52" pathLength="100" stroke="${colors[index]}" stroke-dasharray="${share} ${100 - share}" stroke-dashoffset="${-offset}"><title>${escapeHTML(row.name)} ${row.quantity} 件</title></circle>`;
    offset += share;
    return svg;
  }).join("");
  const legend = rows.slice(0, 4).map((row, index) => `<div class="legend-row"><i style="background:${colors[index]}"></i><div><strong>${escapeHTML(row.name)}</strong><span>${row.quantity} 件・${money(row.revenue)}</span></div></div>`).join("");
  $("#product-chart").innerHTML = `<svg viewBox="0 0 160 160" role="img" aria-label="主要商品銷售件數占比"><circle class="donut-base" cx="80" cy="80" r="52" pathLength="100"/>${segments}<text class="donut-value" x="80" y="76" text-anchor="middle">${total}</text><text class="donut-label" x="80" y="97" text-anchor="middle">付費商品件數</text></svg><div class="product-legend">${legend}</div>`;
}

function renderAdFunnel() {
  const ad = data.ads;
  const stages = [
    ["曝光", ad.impressions], ["連結點擊", ad.linkClicks], ["到達頁面", ad.landingPageViews],
    ["加入購物車", ad.addToCarts], ["開始結帳", ad.checkouts], ["Meta 購買", ad.purchases]
  ];
  const max = stages[0][1];
  $("#ad-funnel").innerHTML = stages.map(([label, value]) => `<div class="funnel-row"><span>${label}</span><div><i style="width:${Math.max(1.5, Math.sqrt(value / max) * 100)}%"></i></div><strong>${Number(value).toLocaleString("zh-TW")}</strong></div>`).join("");
}

function renderAdTrend() {
  const rows = data.ads.monthly;
  const width = 820, height = 292;
  const pad = { left: 52, right: 20, bottom: 44 };
  const chartW = width - pad.left - pad.right;
  const step = chartW / rows.length;
  const maxSpend = Math.max(...rows.map((row) => row.spendUsd), 1);
  const maxPurchases = Math.max(...rows.map((row) => row.purchases), 1);
  const bars = rows.map((row, index) => {
    const x = pad.left + index * step + step * .18;
    const barHeight = row.spendUsd / maxSpend * 92;
    return `<rect x="${x}" y="130" width="${Math.max(4, step * .64)}" height="${barHeight}" transform="translate(0 ${-barHeight})" rx="3"><title>${row.month}｜花費 ${money(row.spendUsd, "USD")}</title></rect>`;
  }).join("");
  const points = rows.map((row, index) => ({ x: pad.left + index * step + step / 2, y: 243 - row.purchases / maxPurchases * 78, row }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const dots = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4"><title>${point.row.month}｜${point.row.purchases} 次購買</title></circle>`).join("");
  const labels = rows.map((row, index) => (index % 2 === 0 || index === rows.length - 1) ? `<text x="${pad.left + index * step + step / 2}" y="${height - 14}" text-anchor="middle">${row.month.slice(2).replace("-", "/")}</text>` : "").join("");
  $("#ad-trend-chart").innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="近一年每月廣告花費與 Meta 購買"><text class="mini-title" x="${pad.left}" y="20">廣告花費（美元）</text><line class="section-line" x1="${pad.left}" y1="130" x2="${width - pad.right}" y2="130"/><g class="ad-bars">${bars}</g><text class="mini-title" x="${pad.left}" y="157">Meta 購買（次）</text><polyline class="ad-line" points="${line}"/><g class="ad-dots">${dots}</g><g class="chart-labels">${labels}</g></svg>`;
}

function currentOrderStatus(order) {
  return sessionStorage.getItem(`demo-order-${order.id}`) || order.status;
}

function renderOrders() {
  const pending = data.sampleOrders.filter((order) => currentOrderStatus(order) === "pending").length;
  $("#pending-count").textContent = `${pending} 筆待處理`;
  $("#order-list").innerHTML = data.sampleOrders.map((order) => {
    const status = currentOrderStatus(order);
    return `<article class="order-card"><div class="order-top"><div><span>${escapeHTML(order.date)}</span><strong>${escapeHTML(order.id)}</strong></div><span class="work-pill ${status}">${status === "pending" ? "待處理" : "已處理"}</span></div><div class="order-product"><span aria-hidden="true">🍃</span><div><strong>${escapeHTML(order.product)}</strong><small>${order.quantity} 件・${escapeHTML(order.customer)}</small></div><b>${money(order.amount)}</b></div><div class="order-meta"><span>${escapeHTML(order.payment)}</span><span>${escapeHTML(order.delivery)}</span></div><button class="order-detail-button" data-order-id="${escapeHTML(order.id)}">查看出貨資料</button></article>`;
  }).join("");
}

function openOrder(orderId) {
  const order = data.sampleOrders.find((item) => item.id === orderId);
  if (!order) return;
  const status = currentOrderStatus(order);
  $("#dialog-title").textContent = order.id;
  $("#order-detail").innerHTML = `<div class="detail-warning">這是虛構示範資料，不是真實顧客。</div><div class="detail-grid"><div><span>收件人</span><strong>${escapeHTML(order.customer)}</strong></div><div><span>電話</span><strong>${escapeHTML(order.phone)}</strong></div><div class="wide"><span>地址</span><strong>${escapeHTML(order.city)}</strong></div><div><span>付款</span><strong>${escapeHTML(order.payment)}</strong></div><div><span>配送</span><strong>${escapeHTML(order.delivery)}</strong></div><div class="wide"><span>商品</span><strong>${escapeHTML(order.product)} × ${order.quantity}</strong></div></div><button class="primary-button dialog-status" data-order-id="${escapeHTML(order.id)}">${status === "pending" ? "標記為已處理" : "改回待處理"}</button>`;
  $("#order-dialog").showModal();
}

function recommendationStatus(id) {
  return sessionStorage.getItem(`demo-recommendation-${id}`) || "new";
}

function renderRecommendations() {
  $("#recommendation-list").innerHTML = data.recommendations.map((item) => {
    const status = recommendationStatus(item.id);
    return `<article class="recommendation-card"><div class="recommendation-top"><span class="recommendation-icon">${item.icon}</span><div><span>${escapeHTML(item.category)}</span><b>${escapeHTML(item.priority)}</b></div></div><h3>${escapeHTML(item.title)}</h3><div class="evidence"><span>數字根據</span><p>${escapeHTML(item.evidence)}</p></div><p class="reason"><strong>為什麼：</strong>${escapeHTML(item.reason)}</p><div class="steps"><span>照這樣做</span><ol>${item.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol></div><div class="success"><span>完成標準</span><p>${escapeHTML(item.success)}</p></div><div class="recommendation-actions">${status === "new" ? `<button class="accept-button" data-decision="accepted" data-id="${item.id}">接受，聯絡掌門</button><button class="skip-button" data-decision="skipped" data-id="${item.id}">先略過</button>` : `<strong>${status === "accepted" ? "✓ 已接受，請聯絡茶路掌門" : "已略過，可隨時重新評估"}</strong><button class="reset-button" data-decision="new" data-id="${item.id}">復原</button>`}</div></article>`;
  }).join("");
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) switchView(nav.dataset.view);
  const go = event.target.closest("[data-go-view]");
  if (go) switchView(go.dataset.goView);
  const orderButton = event.target.closest("[data-order-id]");
  if (orderButton && !orderButton.classList.contains("dialog-status")) openOrder(orderButton.dataset.orderId);
  const statusButton = event.target.closest(".dialog-status");
  if (statusButton) {
    const order = data.sampleOrders.find((item) => item.id === statusButton.dataset.orderId);
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
renderKpis();
renderRevenueChart();
renderProductChart();
renderAdFunnel();
renderAdTrend();
renderOrders();
renderRecommendations();
