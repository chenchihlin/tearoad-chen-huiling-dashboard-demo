window.DEMO_DATA = {
  sampleOrders: [
    { id: "示範-TF2-001", date: "8/27 09:42", customer: "王○玲", phone: "09••-•••-312", city: "臺中市・地址已遮罩", product: "訓導山春茶半斤組", quantity: 2, amount: 2400, payment: "信用卡已付款", delivery: "宅配", status: "pending" },
    { id: "示範-TF2-002", date: "8/27 08:16", customer: "林○美", phone: "09••-•••-628", city: "新北市・地址已遮罩", product: "烏龍紅茶包", quantity: 3, amount: 900, payment: "貨到付款", delivery: "超商取貨", status: "pending" },
    { id: "示範-TF2-003", date: "8/26 17:55", customer: "陳○誠", phone: "09••-•••-105", city: "高雄市・地址已遮罩", product: "春與冬半斤組", quantity: 1, amount: 1200, payment: "信用卡已付款", delivery: "宅配", status: "pending" }
  ],
  recommendations: [
    {
      id: "spring-calendar", icon: "🌿", category: "品牌與銷售", priority: "優先做",
      confidence: "中", quality: "方向性", qualityStatus: "directional",
      target: "下一次春茶預購",
      title: "把春茶預購做成固定的三週節奏",
      evidence: "2026 年 5 月營業額 NT$91,145、30 筆訂單，是近一年最高月份；春茶預購半斤組售出 61 件。",
      reason: "旺季已有明確購買力，但如果只在開賣時曝光，茶農故事與採收進度無法累積期待。",
      alternative: "5 月成長也可能同時受到春茶上市、廣告投入與既有熟客回購影響，不能把全部成長只算在內容暖身上。",
      steps: ["開賣前 21 天：說明訓導山環境與今年茶況", "開賣前 14 天：用照片記錄採收、製茶進度", "開賣前 7 天：公布數量、出貨日與預購連結"],
      guardrail: "不把單一月份成長完全歸因於內容；不使用未確認的採收日期、假稀缺或倒數話術。",
      success: "下一次預購至少完成 6 則暖身內容，並以 5 月的 30 筆訂單作為第一個比較基準。",
      owner: "陳惠玲提供事實・茶路安排內容", review: "下一次春茶預購結束後"
    },
    {
      id: "story-series", icon: "🍵", category: "品牌內容", priority: "本月安排",
      confidence: "中", quality: "需補茶農事實", qualityStatus: "unknown",
      target: "訓導山品牌記憶",
      title: "用四篇內容說清楚「為什麼是訓導山」",
      evidence: "近一年主要營業額集中在春茶、冬茶與季節預購，品牌記憶需要在非開賣期持續累積。",
      reason: "消費者會記得產地背後的人與判斷，不只是一個茶名。固定主題能讓陳惠玲的品牌形象更清楚。",
      alternative: "非開賣期營業額較低，也可能只是商品供應或廣告量減少，不能直接證明品牌記憶不足。",
      steps: ["第一篇：我是誰、為什麼在訓導山做茶", "第二篇：同一塊茶園春茶與冬茶的差別", "第三篇：製茶時最在意的一個細節", "第四篇：適合什麼樣的飲茶者"],
      guardrail: "所有產地、製程與風味說法都由陳惠玲確認；不補寫未發生的故事、對話或功效。",
      success: "四週內完成 4 篇，每篇只回答一個問題，保留真實照片與陳惠玲自己的說法。",
      owner: "陳惠玲提供內容・茶路整理製作", review: "四篇發布完成後"
    },
    {
      id: "bundle-test", icon: "🎁", category: "商品組合", priority: "下次預購前",
      confidence: "低", quality: "需補成本", qualityStatus: "unknown",
      target: "第一次購買的新客",
      title: "讓第一次購買的人更容易選",
      evidence: "近一年平均客單約 NT$2,223；春與冬半斤組已有 22 件銷售，代表比較型組合具有需求。",
      reason: "新客如果無法判斷春茶或冬茶，容易延後決定。清楚的入門選擇能降低第一次購買的猶豫。",
      alternative: "組合銷售也可能主要來自熟客一次補貨；目前沒有新舊客與毛利資料，尚不能證明體驗組一定更有效。",
      steps: ["保留單季半斤組給熟客", "增加一個春冬小份量體驗組給新客", "商品頁直接寫出香氣、口感與適合時段的差別"],
      guardrail: "成本、包材與運費未確認前不降價、不承諾贈品，也不以營業額代替獲利。",
      success: "先測試一檔，不以毛利下結論；比較兩個組合的訂單數、平均客單與顧客詢問內容。",
      owner: "陳惠玲提供成本範圍・茶路設計測試", review: "測試檔期結束後"
    }
  ]
};
