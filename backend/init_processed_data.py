from backend.label_explaination import *
import pandas as pd
from backend.create_labels.label import *
from backend.Data_loader import df_to_navigation_info,get_vin_list
import os

# 导入日志相关模块（如果需要日志功能）
# from backend.log_config import logger

def init_backend_processed_data(selected_vin,test_label=True):
    file_path,vin_list = get_target_file_path(selected_vin)
    # 处理空路径情况
    if not file_path or not os.path.exists(file_path):
        return {"tags": [], 
                "custom_data": {}, 
                "selectedVin": selected_vin, 
                "vinList": vin_list
            }   
    
    # 提取VIN码（文件名去除后缀）
    vin = os.path.splitext(os.path.basename(file_path))[0]
    cache_dir = 'backend/create_labels/label_cache'
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f"{vin}.csv")
    
    # 检查缓存是否存在
    if os.path.exists(cache_file):
        # 从缓存加载label_df
        try:
            # 读取缓存的DataFrame
            label_df = pd.read_csv(cache_file)
            # 打印缓存信息（可选）
            print(f"从缓存加载标签数据: {cache_file}")
        except Exception as e:
            print(f"读取缓存文件失败: {str(e)}，将重新生成")
            label_df = None
    else:
        label_df = None
    
    df = pd.read_csv(file_path)
    navigation_info = df_to_navigation_info(df)
    print(f"{file_path}  Navigation info loaded with {len(navigation_info)} entries.")
    # 如果缓存不存在或读取失败，重新生成
    if label_df is None:
        # 生成标签数据
        bfl = basic_feature_label(navigation_info)
        label_df = bfl.show_basic_feature_label()
        # 保存到缓存
        try:
            label_df.to_excel(cache_file, index=False)
            print(f"标签数据已缓存到: {cache_file}")
        except Exception as e:
            print(f"保存缓存文件失败: {str(e)}")
    
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
    
    if test_label:
        for tag in tag_structures:
            title = tag["title"]
            # 尝试从label_df获取值，不存在则使用默认提示
            value = "未测试此标签"
            
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
    else:
        for tag in tag_structures:
            title = tag["title"]
            # 尝试从label_df获取值，不存在则使用默认提示
            value = "未测试标签生成"
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
            "time": get_route_chart(navigation_info) if 'navigation_info' in locals() else {},        
            "space": loc_poi_heatmap(navigation_info) if 'navigation_info' in locals() else {},
            "destination": poi_type_analysis(navigation_info) if 'navigation_info' in locals() else {},
            "commute-basic": 0,
            "commute-space": 0,
            "work-habit": 0
        },
        "selectedVin": vin,
        "vinList": vin_list
    }
    return processed_data

def get_target_file_path(selected_vin, CSV_DIRECTORY ='/Users/lichen18/Documents/Project/Data_mining/data/data_for_analysis/'):
    """根据VIN码获取对应的CSV文件路径"""
    vin_list = get_vin_list()
    # 确定要处理的文件路径
    if selected_vin and f"{selected_vin}.csv" in os.listdir(CSV_DIRECTORY):
        print("yes")
        file_path = os.path.join(CSV_DIRECTORY, f"{selected_vin}.csv")
    elif vin_list:  # 如果有VIN列表但未选择，使用第一个
        selected_vin = vin_list[0]
        file_path = os.path.join(CSV_DIRECTORY, f"{vin_list[0]}.csv")
    else:
        file_path = ''  # 处理无文件的情况
    return file_path,vin_list



