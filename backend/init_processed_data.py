from backend.label_explaination import *
import pandas as pd
from backend.create_labels.label import *
from backend.Data_loader import df_to_navigation_info  # 确保导入此函数
import os
from backend.create_labels.label import *
def init_backend_processed_data(file_path):
    # 处理空路径情况
    if not file_path or not os.path.exists(file_path):
        return {"tags": [], "custom_data": {}}
    
    # 读取数据并处理
    df = pd.read_csv(file_path)
    navigation_info = df_to_navigation_info(df)
    print(f"{file_path}  Navigation info loaded with {len(navigation_info)} entries.")
    print(navigation_info[:2])  # 打印前两个条目以检查数据格式
    bfl = basic_feature_label(navigation_info)
    label_df = bfl.show_basic_feature_label()
    # 确保label_df是一行数据
    if label_df.shape[0] != 1:
        print("警告：label_df不是一行数据，使用默认值")
        label_df = pd.DataFrame()  # 为空时使用默认值
    
    # 定义标签结构（保留分类和标题，值将从label_df获取）
    tag_structures = [
        # 基础信息类
            {"category": "basic", "title": "居住地", "value": "北京市海淀区"},
            {"category": "basic", "title": "工作地", "value": "北京市朝阳区"},
            
            # 时间规律类
            {"category": "time", "title": "出行周期偏好", "value": "工作日为主"},
            {"category": "time", "title": "出行时段偏好", "value": "早高峰(7:00-9:00)"},
            {"category": "time", "title": "高峰出行模式", "value": "固定路线优先"},
            
            # 空间范围类
            {"category": "space", "title": "单次出行距离", "value": "5-10公里"},
            {"category": "space", "title": "活动区域", "value": "城六区为主"},
            
            # 目的地偏好类
            {"category": "destination", "title": "高频目的地类型", "value": "购物中心、写字楼"},
            
            # 通勤基础类
            {"category": "commute-basic", "title": "规律性行程", "value": "工作日早晚通勤"},
            {"category": "commute-basic", "title": "规律行程距离", "value": "8.5公里"},
            {"category": "commute-basic", "title": "规律行程耗时", "value": "45分钟"},
            
            # 通勤空间类
            {"category": "commute-space", "title": "通勤方向", "value": "由北向南"},
            
            # 工作习惯类
            {"category": "work-habit", "title": "工作时长", "value": "8-9小时/天"}
    ]
    
    # 从label_df注入value值
    processed_tags = []
    print("Label names from label_df:", label_df.columns)  # 调试输出
    # 遍历标签结构，并从label_df获取值
    

    for tag in tag_structures:
        title = tag["title"]
        # 尝试从label_df获取值，不存在则使用默认提示
        if not label_df.empty and title in label_df.columns:
            value = label_df[title].iloc[0]  # 取第一行的值
            print(f"Tag: {title}, Value: {value}")  # 调试输出
            # 处理可能的空值
            value = value if pd.notna(value) else tag["value"]
        else:
            value = tag["value"]  # 使用预设默认值
        
        processed_tags.append({
            "category": tag["category"],
            "title": title,
            "value": value
        })
    
    # 构建最终的processed_data
    processed_data = {
        "tags": processed_tags,
        "custom_data": {
            "basic": 0,          
            "time": get_route_chart(navigation_info),        
            "space": loc_poi_heatmap(navigation_info),
            "destination": poi_type_analysis(navigation_info),
            "commute-basic": 0,
            "commute-space": 0,
            "work-habit": 0
        }
    }
    return processed_data


def get_vin_list(CSV_DIRECTORY = '/Users/lichen18/Documents/Project/Data_mining/data/data_for_analysis/'):
    """从文件夹中获取所有CSV文件的VIN码（文件名不含扩展名）"""
    vin_list = []
    # 配置CSV文件所在目录
    if os.path.exists(CSV_DIRECTORY):
        for filename in os.listdir(CSV_DIRECTORY):
            if filename.endswith('.csv'):
                # 提取文件名（不含.csv）作为VIN码
                vin = os.path.splitext(filename)[0]
                vin_list.append(vin)
    return sorted(vin_list)  # 排序便于查找