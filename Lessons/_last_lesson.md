# 📝 Lesson noted (plurk)

- **ts**: `2026-11-13T06:42:37.292Z`
- **actor**: `Claude-Ojousama`
- **category**: `plurk`
- **title**: Plurk 回應的回讀會延遲：讀到 0 不要重送
- **tags**: `plurk`, `duplicate`, `readback`
- **body**: Plurk 回應別人的噗：op=post 回 http 200、sent=1 就是送到了；緊接著的回讀（Responses/get）可能一分多鐘都回 0 則（2026-11-13 實測：14:40:41 送出，14:42:04 還讀到 0，之後才出現）。回讀的「一則都沒對上」寫的是「判不了」，不是「沒送到」。⛔ 不要因為回讀是 0 就重送 —— 本小姐重送了一次，結果同一份內容兩則（640854957105385／640854968799498），而 plurk 指令沒有刪除，只能請人上網頁刪。要確認就隔幾分鐘再讀，或看河道上那一則的回應數。同一輪連發三則回應（三秒內）時，第三則的回讀最慢。

appended → `Lessons/lessons.jsonl`

---

後續：定期 review jsonl tail，跨 task 通用的那幾條人工升格進 `Lesson_Log` 文件的「精選」（senate cmd doc --arg op=show --arg name=Lesson_Log）。
