from backend.Data_loader import df_to_navigation_info
import pandas as pd
from collections import defaultdict
from backend.label_source_explaination.time_regularity import plot_route_timeline
import base64

from backend.label_source_explaination.poi_preference import process_category_data
def poi_type_analysis(data_list):
    """生成POI类型分析数据，用于扇形图展示"""
    # 调用poi_preference.py中的处理函数
    category_data = process_category_data(data_list)
    # 返回包含类型标识和数据的结构
    return {
        "type": "poi_type_fan_diagram",
        "data": category_data,
        "description": "POI类型分布扇形图（外层：大类，中层：中类，内层：小类）"
    }
def get_route_chart(route_json_data):
    """将图表转换为Base64编码，供前端显示"""
    buf = plot_route_timeline(route_json_data)  # 调用绘图函数
    if buf:
        # 转换为Base64字符串
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        return {
            "type": "image",
            "url": f"data:image/png;base64,{img_base64}",  # 前端可直接使用的图片URL
            "description": "用户路线时序分布（含停留时间）"
        }
    return {"type": "text", "content": "无法生成路线图表"}

if __name__ == '__main__':
    file_path = '/Users/lichen18/Documents/Project/Data_mining/data/data_for_analysis/HLX32B143R1309094.csv'
    df = pd.read_csv(file_path)
    navigation_info = df_to_navigation_info(df)
    
    buf = plot_route_timeline(navigation_info)
    pass