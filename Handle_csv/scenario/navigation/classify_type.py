from collections import defaultdict  # 新增：用于统计分类数据
import pandas as pd
def process_category_data(data_list):
    """处理大中小类数据，返回供前端绘图的结构"""
    # 读取POI类型映射表（路径需根据实际文件位置调整）
    poi_df = pd.read_excel('/Users/lichen18/Documents/Project/Demo_v2.0/use_GaoDe_api/amap_poicode.xlsx')
    reference_dict = {}
    for _, row in poi_df.iterrows():
        new_type_str = str(row['NEW_TYPE']).zfill(6)  # 确保6位编码
        reference_dict[new_type_str] = {
            '大类': row['大类'],
            '中类': row['中类'],
            '小类': row['小类']
        }
    
    # 统计各分类数量
    big_counts = defaultdict(int)
    mid_counts = defaultdict(int)
    sub_counts = defaultdict(int)
    
    for item in data_list:
        type_code = item.get('end_typeCode')  # 假设目的地类型编码存在于end_typeCode字段
        if type_code in reference_dict:
            cat = reference_dict[type_code]
            big_counts[cat['大类']] += 1
            mid_counts[cat['中类']] += 1
            sub_counts[cat['小类']] += 1
    
    # 格式化返回数据（前端绘图需要的结构）
    return {
        "type": "chart",  # 标识为图表类型，供前端识别
        "data": {
            "big_categories": [{"name": k, "value": v} for k, v in big_counts.items()],
            "mid_categories": [{"name": k, "value": v} for k, v in mid_counts.items()],
            "sub_categories": [{"name": k, "value": v} for k, v in sub_counts.items()]
        }
    }