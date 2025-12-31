from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from urllib.parse import quote
import traceback

app = Flask(__name__)
CORS(app)  # 允許跨域請求

# 全局錯誤處理器
@app.errorhandler(Exception)
def handle_exception(e):
    """捕獲所有未處理的異常"""
    error_message = str(e)
    error_type = type(e).__name__
    print(f"[ERROR] 全局錯誤處理器捕獲異常: {error_type}")
    print(f"[ERROR] 錯誤訊息: {error_message}")
    print(f"[ERROR] 錯誤堆疊:\n{traceback.format_exc()}")
    
    # 確保返回有效的 JSON 響應
    response = jsonify({
        'error': f'伺服器內部錯誤：{error_message}',
        'error_type': error_type
    })
    response.status_code = 500
    response.headers['Content-Type'] = 'application/json'
    return response

# opendata.vip API 配置
OPENDATA_VIP_API_BASE_URL = "https://opendata.vip/data/company"

@app.route('/api/company/query', methods=['POST', 'OPTIONS'])
def query_company():
    # 處理 CORS 預檢請求
    if request.method == 'OPTIONS':
        print("[DEBUG] 處理 OPTIONS 預檢請求")
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers['Content-Type'] = 'application/json'
        return response
    
    print(f"[DEBUG] 收到 POST 請求")
    print(f"[DEBUG] Content-Type: {request.content_type}")
    print(f"[DEBUG] 請求方法: {request.method}")
    
    """
    查詢公司資料
    接收參數:
    - queryType: 'taxId' 或 'name'
    - queryValue: 統一編號或公司名稱
    """
    try:
        # 確保請求有 JSON 數據
        if not request.is_json:
            print("[DEBUG] 請求不是 JSON 格式")
            response = jsonify({'error': '請求必須包含 JSON 數據'})
            response.headers['Content-Type'] = 'application/json'
            return response, 400
        
        print("[DEBUG] 開始解析 JSON 數據")
        data = request.get_json()
        if not data:
            print("[DEBUG] JSON 數據為空")
            response = jsonify({'error': '請輸入統一編號或公司名稱'})
            response.headers['Content-Type'] = 'application/json'
            return response, 400
        
        query_type = data.get('queryType', 'taxId')
        query_value = data.get('queryValue', '')
        
        print(f"[DEBUG] 解析結果: query_type={query_type}, query_value={query_value}")
        
        if not query_value:
            print("[DEBUG] query_value 為空")
            response = jsonify({'error': '請輸入統一編號或公司名稱'})
            response.headers['Content-Type'] = 'application/json'
            return response, 400
        
        if query_type == 'taxId' and len(query_value) != 8:
            print(f"[DEBUG] 統一編號長度錯誤: {len(query_value)}")
            response = jsonify({'error': '統一編號必須為 8 位數字'})
            response.headers['Content-Type'] = 'application/json'
            return response, 400
        
        if query_type == 'name' and len(query_value) < 2:
            print(f"[DEBUG] 公司名稱長度錯誤: {len(query_value)}")
            response = jsonify({'error': '公司名稱至少需要 2 個字元'})
            response.headers['Content-Type'] = 'application/json'
            return response, 400
        
        try:
            # 使用 opendata.vip API 查詢公司資料
            print(f"[DEBUG] 開始查詢 opendata.vip: query_type={query_type}, query_value={query_value}")
            
            # 構建 API URL
            api_url = f"{OPENDATA_VIP_API_BASE_URL}?keyword={quote(query_value)}"
            print(f"[DEBUG] API URL: {api_url}")
            
            # 設置請求頭，模擬真實瀏覽器請求
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://opendata.vip/',
                'Origin': 'https://opendata.vip',
                'Connection': 'keep-alive',
            }
            
            # 發送請求
            response = requests.get(api_url, timeout=15, headers=headers)
            print(f"[DEBUG] opendata.vip HTTP 狀態碼: {response.status_code}")
            
            if response.status_code != 200:
                print(f"[DEBUG] opendata.vip 返回錯誤狀態碼: {response.status_code}")
                print(f"[DEBUG] 回應內容: {response.text[:500]}")
                response_obj = jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'})
                response_obj.headers['Content-Type'] = 'application/json'
                return response_obj, 404
            
            # 檢查回應內容是否為空
            response_text = response.text.strip()
            if not response_text:
                print("[DEBUG] opendata.vip 返回空回應")
                response_obj = jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'})
                response_obj.headers['Content-Type'] = 'application/json'
                return response_obj, 404
            
            # 嘗試解析 JSON
            try:
                data = response.json()
            except ValueError as json_error:
                print(f"[DEBUG] opendata.vip JSON 解析錯誤: {json_error}")
                print(f"[DEBUG] 回應內容前 500 字元: {response_text[:500]}")
                response_obj = jsonify({'error': '伺服器回應格式錯誤，無法解析 JSON'})
                response_obj.headers['Content-Type'] = 'application/json'
                return response_obj, 500
            
            # 處理回應格式
            companies = []
            if isinstance(data, dict):
                # 如果回應是字典，嘗試提取資料陣列
                # 優先檢查 'output' 鍵（實際 API 使用的鍵名）
                if 'output' in data:
                    companies = data['output'] if isinstance(data['output'], list) else [data['output']]
                elif 'data' in data:
                    companies = data['data'] if isinstance(data['data'], list) else [data['data']]
                elif 'results' in data:
                    companies = data['results'] if isinstance(data['results'], list) else [data['results']]
                elif 'items' in data:
                    companies = data['items'] if isinstance(data['items'], list) else [data['items']]
                else:
                    # 如果沒有找到常見的鍵，將整個字典作為單一結果
                    companies = [data]
            elif isinstance(data, list):
                companies = data
            else:
                print(f"[DEBUG] opendata.vip 回應格式不正確: {type(data)}")
                response_obj = jsonify({'error': '伺服器回應格式錯誤'})
                response_obj.headers['Content-Type'] = 'application/json'
                return response_obj, 500
            
            print(f"[DEBUG] opendata.vip 返回 {len(companies)} 筆資料")
            if len(companies) > 0:
                print(f"[DEBUG] 第一筆資料的鍵: {list(companies[0].keys()) if isinstance(companies[0], dict) else 'Not a dict'}")
            
            if len(companies) == 0:
                print("[DEBUG] 沒有找到任何資料，返回 404")
                response_obj = jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'})
                response_obj.headers['Content-Type'] = 'application/json'
                return response_obj, 404
            
            # 返回結果
            response_obj = jsonify({
                'success': True,
                'data': companies,
                'count': len(companies)
            })
            response_obj.headers['Content-Type'] = 'application/json'
            print(f"[DEBUG] 成功返回 {len(companies)} 筆資料")
            return response_obj
            
        except requests.exceptions.Timeout:
            print("[DEBUG] 請求超時")
            response = jsonify({'error': '查詢超時，請稍後再試 或縮小搜尋範圍'})
            response.headers['Content-Type'] = 'application/json'
            return response, 504
        except requests.exceptions.ConnectionError as e:
            print(f"[DEBUG] 連接錯誤: {type(e).__name__}: {e}")
            import traceback
            print(f"[DEBUG] 錯誤堆疊:\n{traceback.format_exc()}")
            response = jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'})
            response.headers['Content-Type'] = 'application/json'
            return response, 500
        except requests.exceptions.RequestException as e:
            print(f"[DEBUG] 請求錯誤: {type(e).__name__}: {e}")
            import traceback
            print(f"[DEBUG] 錯誤堆疊:\n{traceback.format_exc()}")
            error_msg = str(e).lower()
            if 'connection' in error_msg or 'max' in error_msg or 'too many' in error_msg:
                response = jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'})
                response.headers['Content-Type'] = 'application/json'
                return response, 500
            response = jsonify({'error': f'請求失敗：{str(e)}'})
            response.headers['Content-Type'] = 'application/json'
            return response, 500
        except Exception as api_error:
            error_message = str(api_error)
            error_type = type(api_error).__name__
            print(f"[ERROR] API 錯誤類型: {error_type}")
            print(f"[ERROR] API 錯誤訊息: {error_message}")
            import traceback
            print(f"[ERROR] 錯誤堆疊:\n{traceback.format_exc()}")
            
            error_lower = error_message.lower()
            
            # 檢查錯誤訊息中是否包含 404
            if '404' in error_message or 'Status 404' in error_message or '(Status 404)' in error_message:
                response = jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'})
                response.headers['Content-Type'] = 'application/json'
                return response, 404
            elif 'timeout' in error_lower or 'timed out' in error_lower:
                response = jsonify({'error': '查詢超時，請稍後再試 或縮小搜尋範圍'})
                response.headers['Content-Type'] = 'application/json'
                return response, 504
            elif 'not found' in error_lower or 'no result' in error_lower:
                response = jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'})
                response.headers['Content-Type'] = 'application/json'
                return response, 404
            elif 'connection' in error_lower or 'max' in error_lower or 'too many' in error_lower or 'unpack' in error_lower:
                response = jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'})
                response.headers['Content-Type'] = 'application/json'
                return response, 500
            else:
                response = jsonify({'error': f'查詢失敗：{error_message}'})
                response.headers['Content-Type'] = 'application/json'
                return response, 500
            
    except Exception as e:
        error_message = str(e)
        error_type = type(e).__name__
        print(f"[ERROR] 最外層錯誤類型: {error_type}")
        print(f"[ERROR] 最外層錯誤訊息: {error_message}")
        import traceback
        print(f"[ERROR] 最外層錯誤堆疊:\n{traceback.format_exc()}")
        
        error_lower = error_message.lower()
        if 'connection' in error_lower or 'max' in error_lower or 'too many' in error_lower or 'unpack' in error_lower:
            return jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'}), 500
        elif 'json' in error_lower or 'decode' in error_lower:
            return jsonify({'error': '請求格式錯誤，請檢查輸入數據'}), 400
        else:
            return jsonify({'error': f'伺服器錯誤：{error_message}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """健康檢查端點"""
    response = jsonify({'status': 'ok'})
    response.headers['Content-Type'] = 'application/json'
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

