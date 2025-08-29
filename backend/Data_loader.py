import os
def df_to_navigation_info(df,config = None)->list[dict]:
    navigation_info = []
    for index, row in df.iterrows():
        info = {
            "vin": row['vin'],
            "start_location": row['start_location_str'],
            "end_location": row['end_location_str'],
            "end_adcode": row['end_adcode'],
            "end_typeCode": row['end_typeCode'],
            "end_address": row["end_address"],
            "poi": row['end_name'],
            'start_time': row['create_time'],
            'end_time': row['end_time'],
            'distance': row['distance'],
            'duration': row['duration']
        }
        navigation_info.append(info)
    return navigation_info


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