from backend.Data_loader import df_to_navigation_info
import pandas as pd
from collections import defaultdict
from backend.label_source_explaination.time_regularity import process_route_timeline_data

from backend.label_source_explaination.poi_preference import process_category_data
from backend.label_source_explaination.heatmap import plot_origin_destination_heatmap
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
    """获取处理后的路线时间数据"""
    processed_data = process_route_timeline_data(route_json_data)  # 调用修改后的函数
    if processed_data:
        return {
            "type": "time_regularity_plot",  # 指定类型
            "data": processed_data,
            "description": "用户路线时间规律可视化"
        }
    return {"type": "text", "content": "无法生成路线时间数据"}


# 新增函数
def loc_poi_heatmap(data_list):
    """生成起点区域与目的地的热力图数据"""
    heatmap_data = plot_origin_destination_heatmap(data_list)
    if heatmap_data is not None:
        return {
            "type": "loc_poi_heatmap",
            "data": heatmap_data,
            "description": "出发点区域到目的地的导航频率热力图"
        }
    return {"type": "text", "content": "无法生成热力图数据"}

if __name__ == '__main__':
    file_path = '/Users/lichen18/Documents/Project/Data_mining/data/data_for_analysis/HLX32B143R1309094.csv'
    df = pd.read_csv(file_path)
    navigation_info = df_to_navigation_info(df)
    pass