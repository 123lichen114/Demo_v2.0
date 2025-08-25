import pandas as pd

def process_category_data(data_list):
    """处理大中小类数据，返回包含层级关系的结构（大类包含中类，中类包含小类）"""
    # 读取POI类型映射表（路径需根据实际文件位置调整）
    poi_df = pd.read_excel('backend/use_api/use_gaode/amap_poicode.xlsx')
    reference_dict = {}
    for _, row in poi_df.iterrows():
        new_type_str = str(row['NEW_TYPE']).zfill(6)  # 确保6位编码
        reference_dict[new_type_str] = {
            '大类': row['大类'],
            '中类': row['中类'],
            '小类': row['小类']
        }
    
    # 构建层级字典（不用defaultdict，手动初始化普通字典）
    # 结构：{大类: {'count': 总数, 'mid_categories': {中类: {'count': 总数, 'sub_categories': {小类: 数量}}}}}
    hierarchy = {}
    
    for item in data_list:
        type_code = item.get('end_typeCode')
        if type_code in reference_dict:
            cat = reference_dict[type_code]
            big_name = cat['大类']
            mid_name = cat['中类']
            sub_name = cat['小类']
            
            # 处理大类
            if big_name not in hierarchy:
                # 初始化大类：包含计数和中类字典
                hierarchy[big_name] = {'count': 0, 'mid_categories': {}}
            hierarchy[big_name]['count'] += 1  # 大类计数累加（等于下属中类总和）
            
            # 处理中类（隶属于当前大类）
            mid_categories = hierarchy[big_name]['mid_categories']
            if mid_name not in mid_categories:
                # 初始化中类：包含计数和小类字典
                mid_categories[mid_name] = {'count': 0, 'sub_categories': {}}
            mid_categories[mid_name]['count'] += 1  # 中类计数累加（等于下属小类总和）
            
            # 处理小类（隶属于当前中类）
            sub_categories = mid_categories[mid_name]['sub_categories']
            if sub_name not in sub_categories:
                sub_categories[sub_name] = 0
            sub_categories[sub_name] += 1  # 小类计数累加
    
    # 转换为前端易处理的列表结构
    result = []
    for big_name, big_info in hierarchy.items():
        mid_list = []
        # 处理中类列表
        for mid_name, mid_info in big_info['mid_categories'].items():
            sub_list = [
                {"name": sub_name, "value": sub_count}
                for sub_name, sub_count in mid_info['sub_categories'].items()
            ]
            mid_list.append({
                "name": mid_name,
                "value": mid_info['count'],
                "sub_categories": sub_list
            })
        # 处理大类列表
        result.append({
            "name": big_name,
            "value": big_info['count'],
            "mid_categories": mid_list
        })
    
    return result