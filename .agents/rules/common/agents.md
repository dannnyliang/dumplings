# Agent Orchestration

## 本專案不定義任何自訂 subagent

`~/.claude/agents/` 目前不存在，本專案也沒有 `.agents/agents/`。任何規則文件若指名 `planner`、`tdd-guide`、`code-reviewer`、`e2e-runner` 等 agent，那都是**尚未實現的計畫**，不要嘗試呼叫。

可用的 agent 由當下的 harness 決定，執行前以 harness 實際提供的清單為準。

## 不要主動派生 agent

除非使用者明確要求，否則不要為了「加速」或「多角度分析」自行派生 subagent。理由：

- 主 context 看不到 subagent 的中間過程，出錯時難以追查
- 這個專案規模小，單一 context 足以掌握全貌
- 使用者的全域偏好明確要求不主動呼叫 agent

需要多角度檢查時，直接在主 context 依序做完，並在結論後補一段反方自我批評。

## 真的需要時

使用者明確要求後才派生，且必須：

1. 一次把獨立的工作平行送出，不要一個做完再開下一個
2. 在 prompt 裡寫清楚回傳格式，因為 subagent 的回覆是資料不是給人看的訊息
3. 自己驗證回傳結果，不要直接當成事實採用
