# backend/label_source_explaination/time_regularity.py
# 在现有代码基础上添加以下函数
from backend.Util import parse_datetime
def process_route_timeline_data(poi_info_list):
    """处理路线时间线数据，提取开始时间、预计时长和目的地"""
    processed_data = []
    for item in poi_info_list:
        try:
            # 提取开始时间（保持原始格式）
            start_time = item["start_time"]
            
            # 计算预计导航时间（秒）：优先使用duration字段，若无则通过结束时间计算
            if "duration" in item:
                # 处理可能的字符串类型duration（如路径数据中的"18"）
                duration = int(item["duration"])
            else:
                # 若没有duration字段，通过结束时间与开始时间差值计算
                start_dt = parse_datetime(start_time)
                end_dt = parse_datetime(item["end_time"])
                duration = int((end_dt - start_dt).total_seconds())
            
            # 提取目的地名称
            poi = item.get("poi", "未知目的地")
            
            processed_data.append({
                "start_time": start_time,
                "duration": duration,
                "poi": poi
            })
        except (KeyError, ValueError) as e:
            print(f"数据处理警告: 跳过无效条目 {item.get('id')}，错误: {str(e)}")
            continue
    return processed_data