from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from urllib.parse import quote

app = Flask(__name__)
CORS(app)  # 允許跨域請求

# 經濟部商業司開放資料 API 配置
GCIS_API_BASE_URL_1 = "https://data.gcis.nat.gov.tw/od/data/api/236EE382-4942-41A9-BD03-CA0709025E7C"  # 基本資料
GCIS_API_BASE_URL_2 = "https://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA6"  # 詳細資料（資本額、登記機關等）
GCIS_API_BASE_URL_3 = "https://data.gcis.nat.gov.tw/od/data/api/6BBA2268-1367-4B42-9CCA-BC17499EBE8C"  # 公司資料（使用公司名稱和狀態）
GCIS_API_BASE_URL_4 = "https://data.gcis.nat.gov.tw/od/data/api/7E6AFA72-AD6A-46D3-8681-ED77951D912D"  # 負責人資料（使用 President_No 和 Agency）
GCIS_API_BASE_URL_5 = "https://data.gcis.nat.gov.tw/od/data/api/F570BC9A-DA4C-4813-8087-FB9CE95F9D38"  # 負責人資料2（使用 President_No 和 Agency）
GCIS_API_BASE_URL_6 = "https://data.gcis.nat.gov.tw/od/data/api/A1B4CBFF-2D3A-409B-8A78-2AD94F63AE4A"  # 商業登記資料（使用 Business_Name 和 Business_Current_Status）
GCIS_API_BASE_URL_7 = "https://data.gcis.nat.gov.tw/od/data/api/4E5F7653-1B91-4DDC-99D5-468530FAE396"  # 董監事/股東資料（使用 Business_Accounting_NO）

@app.route('/api/company/query', methods=['POST', 'OPTIONS'])
def query_company():
    # 處理 CORS 預檢請求
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    """
    查詢公司資料
    接收參數:
    - queryType: 'taxId' 或 'name'
    - queryValue: 統一編號或公司名稱
    """
    try:
        data = request.get_json()
        query_type = data.get('queryType', 'taxId')
        query_value = data.get('queryValue', '')
        
        if not query_value:
            return jsonify({'error': '請輸入統一編號或公司名稱'}), 400
        
        if query_type == 'taxId' and len(query_value) != 8:
            return jsonify({'error': '統一編號必須為 8 位數字'}), 400
        
        if query_type == 'name' and len(query_value) < 2:
            return jsonify({'error': '公司名稱至少需要 2 個字元'}), 400
        
        try:
            # 使用經濟部商業司開放資料 API 查詢公司資料
            companies = []
            
            print(f"[DEBUG] 開始查詢: query_type={query_type}, query_value={query_value}")
            
            import concurrent.futures
            
            def fetch_api(url, api_name):
                try:
                    response = requests.get(url, timeout=15)
                    print(f"[DEBUG] {api_name} HTTP 狀態碼: {response.status_code}")
                    if response.status_code == 200:
                        # 檢查回應內容是否為空
                        response_text = response.text.strip()
                        if not response_text:
                            print(f"[DEBUG] {api_name} 返回空回應")
                            return []
                        
                        # 嘗試解析 JSON
                        try:
                            data = response.json()
                        except ValueError as json_error:
                            print(f"[DEBUG] {api_name} JSON 解析錯誤: {json_error}")
                            print(f"[DEBUG] {api_name} 回應內容前 500 字元: {response_text[:500]}")
                            return []
                        
                        # 處理回應格式
                        if isinstance(data, dict):
                            if 'value' in data:
                                return data['value'] if isinstance(data['value'], list) else [data['value']]
                            elif 'data' in data:
                                return data['data'] if isinstance(data['data'], list) else [data['data']]
                            else:
                                return [data]
                        elif isinstance(data, list):
                            return data
                        else:
                            return []
                    else:
                        print(f"[DEBUG] {api_name} 返回錯誤狀態碼: {response.status_code}")
                        print(f"[DEBUG] {api_name} 回應內容: {response.text[:500]}")
                        return []
                except requests.exceptions.Timeout:
                    print(f"[DEBUG] {api_name} 請求超時")
                    return []
                except requests.exceptions.RequestException as e:
                    print(f"[DEBUG] {api_name} 請求錯誤: {type(e).__name__}: {e}")
                    return []
                except Exception as e:
                    print(f"[DEBUG] {api_name} 未知錯誤: {type(e).__name__}: {e}")
                    import traceback
                    print(f"[DEBUG] {api_name} 錯誤堆疊:\n{traceback.format_exc()}")
                    return []
            
            companies_dict = {}
            tax_ids_to_query = []
            
            # 如果使用公司名稱查詢，先查詢 API 3 獲取統一編號（API 3 支援 Company_Name 查詢，但需要狀態）
            if query_type == 'name':
                print(f"[DEBUG] 使用公司名稱查詢，先查詢 API 3 獲取統一編號")
                # API 3 需要 Company_Name 和 Company_Status
                # 嘗試多個常見狀態：'01' (核准設立), '02' (核准登記)
                statuses_to_try = ['01', '02']
                all_results = []
                
                for status in statuses_to_try:
                    filter3 = f"Company_Name like '%{query_value}%' and Company_Status eq '{status}'"
                    api3_url = f"{GCIS_API_BASE_URL_3}?$format=json&$filter={quote(filter3)}&$skip=0&$top=100"
                    print(f"[DEBUG] API 3 URL (狀態 {status}): {api3_url}")
                    
                    data3 = fetch_api(api3_url, f"API 3 (狀態 {status})")
                    print(f"[DEBUG] API 3 (狀態 {status}) 返回 {len(data3)} 筆資料")
                    
                    if data3:
                        all_results.extend(data3)
                
                # 從 API 3 的結果中提取統一編號
                for item in all_results:
                    tax_id = item.get('Business_Accounting_NO', '')
                    if tax_id and tax_id not in tax_ids_to_query:
                        tax_ids_to_query.append(tax_id)
                        # 先將 API 3 的資料加入字典
                        companies_dict[tax_id] = item.copy()
                        companies_dict[tax_id]['directors'] = []
                        companies_dict[tax_id]['shareholders'] = []
                
                if not tax_ids_to_query:
                    print("[DEBUG] API 3 沒有返回任何統一編號")
                    return jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'}), 404
                
                print(f"[DEBUG] 從 API 3 取得 {len(tax_ids_to_query)} 個統一編號: {tax_ids_to_query}")
            else:
                # 使用統一編號查詢
                tax_ids_to_query = [query_value]
            
            # 使用統一編號查詢 API 1、2、7
            api_urls = []
            for tax_id in tax_ids_to_query:
                filter_param = f"Business_Accounting_NO eq '{tax_id}'"
                filter_encoded = quote(filter_param)
                
                # 如果已經有資料（從公司名稱查詢獲取），跳過 API 1
                if tax_id not in companies_dict:
                    api_urls.append((f"{GCIS_API_BASE_URL_1}?$format=json&$filter={filter_encoded}&$skip=0&$top=100", f"API 1 (基本資料-{tax_id})"))
                else:
                    api_urls.append(None)  # 佔位符，保持索引一致
                
                api_urls.append((f"{GCIS_API_BASE_URL_2}?$format=json&$filter={filter_encoded}&$skip=0&$top=100", f"API 2 (詳細資料-{tax_id})"))
                api_urls.append((f"{GCIS_API_BASE_URL_7}?$format=json&$filter={filter_encoded}&$skip=0&$top=100", f"API 7 (董監事/股東資料-{tax_id})"))
                
                # 如果使用統一編號查詢，初始化字典
                if query_type == 'taxId' and tax_id not in companies_dict:
                    companies_dict[tax_id] = {'directors': [], 'shareholders': []}
            
            # 並行查詢所有 API（過濾掉 None 值）
            valid_api_urls = []
            api_url_mapping = {}  # 記錄每個 API URL 對應的統一編號和 API 類型
            
            for tax_id_index, tax_id in enumerate(tax_ids_to_query):
                needs_api1 = tax_id not in companies_dict or query_type == 'taxId'
                
                if needs_api1:
                    url1 = f"{GCIS_API_BASE_URL_1}?$format=json&$filter={quote(f'Business_Accounting_NO eq \'{tax_id}\'')}&$skip=0&$top=100"
                    name1 = f"API 1 (基本資料-{tax_id})"
                    valid_api_urls.append((url1, name1))
                    api_url_mapping[len(valid_api_urls) - 1] = (tax_id_index, 'api1')
                
                url2 = f"{GCIS_API_BASE_URL_2}?$format=json&$filter={quote(f'Business_Accounting_NO eq \'{tax_id}\'')}&$skip=0&$top=100"
                name2 = f"API 2 (詳細資料-{tax_id})"
                valid_api_urls.append((url2, name2))
                api_url_mapping[len(valid_api_urls) - 1] = (tax_id_index, 'api2')
                
                url7 = f"{GCIS_API_BASE_URL_7}?$format=json&$filter={quote(f'Business_Accounting_NO eq \'{tax_id}\'')}&$skip=0&$top=100"
                name7 = f"API 7 (董監事/股東資料-{tax_id})"
                valid_api_urls.append((url7, name7))
                api_url_mapping[len(valid_api_urls) - 1] = (tax_id_index, 'api7')
            
            print(f"[DEBUG] 準備查詢 {len(valid_api_urls)} 個 API")
            
            # 限制並行連接數，避免超出最大連線數量
            max_workers = min(5, len(valid_api_urls))  # 最多 5 個並行連接
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [executor.submit(fetch_api, url, name) for url, name in valid_api_urls]
                results = [f.result() for f in futures]
            
            # 處理 API 1、2 和 7 的結果
            # 使用映射來正確分配結果
            api_results = {}  # {(tax_id_index, api_type): result}
            for result_idx, result in enumerate(results):
                if result_idx in api_url_mapping:
                    tax_id_idx, api_type = api_url_mapping[result_idx]
                    api_results[(tax_id_idx, api_type)] = result
            
            for tax_id_index, tax_id in enumerate(tax_ids_to_query):
                # 安全地獲取結果
                data1 = api_results.get((tax_id_index, 'api1'), [])
                data2 = api_results.get((tax_id_index, 'api2'), [])
                data7 = api_results.get((tax_id_index, 'api7'), [])
                
                # 確保統一編號在字典中
                if tax_id not in companies_dict:
                    companies_dict[tax_id] = {'directors': [], 'shareholders': []}
                
                # 合併 API 1 的資料
                if isinstance(data1, list):
                    for item in data1:
                        if isinstance(item, dict):
                            item_tax_id = item.get('Business_Accounting_NO', '')
                            if item_tax_id == tax_id or not item_tax_id:
                                # 更新資料，保留 directors 和 shareholders
                                existing_directors = companies_dict[tax_id].get('directors', [])
                                existing_shareholders = companies_dict[tax_id].get('shareholders', [])
                                companies_dict[tax_id].update(item)
                                companies_dict[tax_id]['directors'] = existing_directors
                                companies_dict[tax_id]['shareholders'] = existing_shareholders
                
                # 合併 API 2 的資料
                if isinstance(data2, list):
                    for item in data2:
                        if isinstance(item, dict):
                            item_tax_id = item.get('Business_Accounting_NO', '')
                            if item_tax_id == tax_id or not item_tax_id:
                                # 更新資料，保留 directors 和 shareholders
                                existing_directors = companies_dict[tax_id].get('directors', [])
                                existing_shareholders = companies_dict[tax_id].get('shareholders', [])
                                companies_dict[tax_id].update(item)
                                companies_dict[tax_id]['directors'] = existing_directors
                                companies_dict[tax_id]['shareholders'] = existing_shareholders
                
                # 合併 API 7 的資料（董監事/股東）
                if isinstance(data7, list):
                    for item in data7:
                        if isinstance(item, dict):
                            # 根據職位判斷是董監事還是股東
                            position = item.get('Person_Position_Name', '')
                            person_name = item.get('Person_Name', '')
                            juristic_name = item.get('Juristic_Person_Name', '')
                            shareholding = item.get('Person_Shareholding', 0)
                            
                            person_info = {
                                'name': person_name or juristic_name or '-',
                                'position': position or '-',
                                'shares': shareholding if shareholding else None
                            }
                            
                            # 判斷是董監事還是股東
                            if position and ('董事' in position or '監事' in position or '董事長' in position):
                                companies_dict[tax_id]['directors'].append(person_info)
                            elif shareholding and shareholding > 0:
                                companies_dict[tax_id]['shareholders'].append(person_info)
            
            # 轉換為列表
            companies = list(companies_dict.values())
            
            print(f"[DEBUG] 合併後共 {len(companies)} 筆資料")
            if len(companies) > 0:
                print(f"[DEBUG] 第一筆資料的鍵: {list(companies[0].keys())}")
            
            print(f"[DEBUG] 最終返回 {len(companies)} 筆資料")
            
            if len(companies) == 0:
                print("[DEBUG] 沒有找到任何資料，返回 404")
                return jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'}), 404
            
            return jsonify({
                'success': True,
                'data': companies,
                'count': len(companies)
            })
            
        except requests.exceptions.Timeout:
            print("[DEBUG] 請求超時")
            return jsonify({'error': '查詢超時，請稍後再試 或縮小搜尋範圍'}), 504
        except requests.exceptions.ConnectionError as e:
            print(f"[DEBUG] 連接錯誤: {type(e).__name__}: {e}")
            import traceback
            print(f"[DEBUG] 錯誤堆疊:\n{traceback.format_exc()}")
            return jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'}), 500
        except requests.exceptions.RequestException as e:
            print(f"[DEBUG] 請求錯誤: {type(e).__name__}: {e}")
            import traceback
            print(f"[DEBUG] 錯誤堆疊:\n{traceback.format_exc()}")
            error_msg = str(e).lower()
            if 'connection' in error_msg or 'max' in error_msg or 'too many' in error_msg:
                return jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'}), 500
            return jsonify({'error': f'請求失敗：{str(e)}'}), 500
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
                return jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'}), 404
            elif 'timeout' in error_lower or 'timed out' in error_lower:
                return jsonify({'error': '查詢超時，請稍後再試 或縮小搜尋範圍'}), 504
            elif 'not found' in error_lower or 'no result' in error_lower:
                return jsonify({'error': '查無資料，請確認輸入的統一編號或公司名稱是否正確'}), 404
            elif 'connection' in error_lower or 'max' in error_lower or 'too many' in error_lower or 'unpack' in error_lower:
                return jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'}), 500
            else:
                return jsonify({'error': f'查詢失敗：{error_message}'}), 500
            
    except Exception as e:
        error_message = str(e).lower()
        if 'connection' in error_message or 'max' in error_message or 'too many' in error_message or 'unpack' in error_message:
            return jsonify({'error': '超出同時最大連線數量，請稍後再試。請縮小搜尋範圍'}), 500
        return jsonify({'error': f'伺服器錯誤：{str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """健康檢查端點"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

