from Data_loader import df_to_navigation_info
import pandas as pd
from Handle_csv.scenario.navigation.visualization import *

from Handle_csv.scenario.navigation.origin_destination_heatmap import *

from Handle_csv.scenario.navigation.navigation_poi_time import *
import base64
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
    navigation_info = df_to_navigation_info(df)
    df = pd.read_csv(file_path)
    plot_destination_time_heatmap(navigation_info)
    fig = plot_origin_destination_heatmap(navigation_info,grid_size=10000)
    buf = plot_route_timeline(navigation_info)
    pass