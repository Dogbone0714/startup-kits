# 後端 API 服務

Python Flask 後端服務，用於處理公司資料查詢。

## 安裝依賴

```
pip install -r requirements.txt
```

## 啟動服務

```
python app.py
```

服務將在 `http://localhost:5000` 啟動

## API 端點

### POST /api/company/query

查詢公司資料

**請求體：**
```json
{
  "queryType": "taxId",  // 或 "name"
  "queryValue": "60578678"  // 統一編號或公司名稱
}
```

**回應：**
```json
{
  "success": true,
  "data": [...],
  "count": 1
}
```

### GET /health

健康檢查端點

**回應：**
```json
{
  "status": "ok"
}
```

