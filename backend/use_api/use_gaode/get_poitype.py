import pandas as pd

def get_types_from_table(code, file_path='backend/use_api/use_gaode/amap_poicode.xlsx',
                        new_type_col='NEW_TYPE', 
                        big_col='大类', 
                        medium_col='中类', 
                        small_col='小类')-> str:
    """
    从表格中根据NEW_TYPE代码查询对应的大类、中类、小类
    
    参数:
        code: 输入的NEW_TYPE代码
        df: 包含类别信息的DataFrame
        new_type_col: NEW_TYPE列的列名，默认为'NEW_TYPE'
        big_col: 大类列的列名，默认为'大类'
        medium_col: 中类列的列名，默认为'中类'
        small_col: 小类列的列名，默认为'小类'
    
    返回:
        元组 (大类, 中类, 小类)，若未找到则返回 (None, None, None)
    """
    # 筛选出匹配的行
    df = pd.read_excel(file_path)
    #创建一个空行，列名和df一样
    for _, row in df.iterrows():
        if str(row[new_type_col]).zfill(6) == code:
            result = row
            big = result[big_col]
            medium = result[medium_col]
            small = result[small_col]
            return f" {big} > {medium} > {small}"
    return "未知类别 > 未知类别 > 未知类别"