window.DEMO_DATA = {
  farmer: { name: "陳惠玲", brand: "訓導山" },
  sourcePeriod: "2025-08-01 至 2026-07-31",
  orders: { revenue: 368905, orderCount: 173, totalOrderCount: 178, averageOrderValue: 2132.4 },
  monthly: [
    { month: "2025-08", orders: 7, revenue: 9955 },
    { month: "2025-09", orders: 16, revenue: 29975 },
    { month: "2025-10", orders: 15, revenue: 30600 },
    { month: "2025-11", orders: 17, revenue: 50580 },
    { month: "2025-12", orders: 23, revenue: 38495 },
    { month: "2026-01", orders: 22, revenue: 32185 },
    { month: "2026-02", orders: 4, revenue: 5530 },
    { month: "2026-03", orders: 1, revenue: 3550 },
    { month: "2026-04", orders: 14, revenue: 42290 },
    { month: "2026-05", orders: 30, revenue: 91145 },
    { month: "2026-06", orders: 14, revenue: 21455 },
    { month: "2026-07", orders: 10, revenue: 13145 }
  ],
  products: [
    { name: "訓導山春茶半斤組（預購）", quantity: 61, revenue: 73200 },
    { name: "訓導山冬茶半斤組（預購）", quantity: 40, revenue: 48000 },
    { name: "春與冬半斤組（預購）", quantity: 22, revenue: 26400 },
    { name: "烏龍紅茶包", quantity: 22, revenue: 6600 },
    { name: "其他付費商品", quantity: 216, revenue: 214705 }
  ],
  ads: {
    status: "進行中", fetchedAt: "2026-08-27 21:16", spendUsd: 1846.78,
    impressions: 505935, reachDailySum: 393664, clicks: 29303, linkClicks: 4218,
    landingPageViews: 3717, addToCarts: 653, checkouts: 257, purchases: 169,
    monthly: [
      { month: "2025-08", spendUsd: 126.72, purchases: 9 },
      { month: "2025-09", spendUsd: 180.10, purchases: 17 },
      { month: "2025-10", spendUsd: 185.22, purchases: 18 },
      { month: "2025-11", spendUsd: 180.36, purchases: 18 },
      { month: "2025-12", spendUsd: 185.86, purchases: 19 },
      { month: "2026-01", spendUsd: 185.21, purchases: 21 },
      { month: "2026-02", spendUsd: 50.58, purchases: 5 },
      { month: "2026-03", spendUsd: 0, purchases: 0 },
      { month: "2026-04", spendUsd: 105.84, purchases: 13 },
      { month: "2026-05", spendUsd: 228.31, purchases: 26 },
      { month: "2026-06", spendUsd: 238.72, purchases: 16 },
      { month: "2026-07", spendUsd: 179.86, purchases: 7 }
    ]
  },
  sampleOrders: [
    { id: "示範-TF2-001", date: "8/27 09:42", customer: "王○玲", phone: "09••-•••-312", city: "臺中市・地址已遮罩", product: "訓導山春茶半斤組", quantity: 2, amount: 2400, payment: "信用卡已付款", delivery: "宅配", status: "pending" },
    { id: "示範-TF2-002", date: "8/27 08:16", customer: "林○美", phone: "09••-•••-628", city: "新北市・地址已遮罩", product: "烏龍紅茶包", quantity: 3, amount: 900, payment: "貨到付款", delivery: "超商取貨", status: "pending" },
    { id: "示範-TF2-003", date: "8/26 17:55", customer: "陳○誠", phone: "09••-•••-105", city: "高雄市・地址已遮罩", product: "春與冬半斤組", quantity: 1, amount: 1200, payment: "信用卡已付款", delivery: "宅配", status: "pending" }
  ],
  recommendations: [
    {
      id: "spring-calendar", icon: "🌿", category: "品牌與銷售", priority: "優先做",
      title: "把春茶預購做成固定的三週節奏",
      evidence: "2026 年 5 月營業額 NT$91,145、30 筆訂單，是近一年最高月份；春茶預購半斤組售出 61 件。",
      reason: "旺季已有明確購買力，但如果只在開賣時曝光，茶農故事與採收進度無法累積期待。",
      steps: ["開賣前 21 天：說明訓導山環境與今年茶況", "開賣前 14 天：用照片記錄採收、製茶進度", "開賣前 7 天：公布數量、出貨日與預購連結"],
      success: "下一次預購至少完成 6 則暖身內容，並以 5 月的 30 筆訂單作為第一個比較基準。"
    },
    {
      id: "story-series", icon: "🍵", category: "品牌內容", priority: "本月安排",
      title: "用四篇內容說清楚「為什麼是訓導山」",
      evidence: "近一年主要營業額集中在春茶、冬茶與季節預購，品牌記憶需要在非開賣期持續累積。",
      reason: "消費者會記得產地背後的人與判斷，不只是一個茶名。固定主題能讓陳惠玲的品牌形象更清楚。",
      steps: ["第一篇：我是誰、為什麼在訓導山做茶", "第二篇：同一塊茶園春茶與冬茶的差別", "第三篇：製茶時最在意的一個細節", "第四篇：適合什麼樣的飲茶者"],
      success: "四週內完成 4 篇，每篇只回答一個問題，保留真實照片與陳惠玲自己的說法。"
    },
    {
      id: "bundle-test", icon: "🎁", category: "商品組合", priority: "下次預購前",
      title: "讓第一次購買的人更容易選",
      evidence: "平均客單 NT$2,132；春與冬半斤組已有 22 件銷售，代表比較型組合具有需求。",
      reason: "新客如果無法判斷春茶或冬茶，容易延後決定。清楚的入門選擇能降低第一次購買的猶豫。",
      steps: ["保留單季半斤組給熟客", "增加一個春冬小份量體驗組給新客", "商品頁直接寫出香氣、口感與適合時段的差別"],
      success: "先測試一檔，不以毛利下結論；比較兩個組合的訂單數與平均客單。"
    },
    {
      id: "ad-refresh", icon: "📣", category: "廣告改善", priority: "聯絡茶路",
      title: "先換素材，再決定是否增加預算",
      evidence: "5 月花費 US$228.31 帶來 26 次購買，每次約 US$8.78；7 月花費 US$179.86 只帶來 7 次，每次約 US$25.69。",
      reason: "7 月每次購買成本約為 5 月的 2.9 倍，近期效率明顯轉弱；直接加預算可能放大浪費。",
      steps: ["請茶路拆看 5 月表現最好的素材與受眾", "以陳惠玲本人、訓導山環境、春冬茶差異各做一支新素材", "新舊素材各跑 7 天，再由茶路掌門判斷預算"],
      success: "新素材累積至少 7 天資料，Meta 每次購買成本低於 US$15，再討論提高預算。"
    }
  ]
};
