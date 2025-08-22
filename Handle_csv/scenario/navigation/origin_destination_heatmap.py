import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict

# 常量：地球半径(米)
EARTH_RADIUS = 6371000

def meters_to_degrees(meters, latitude):
    """将米转换为经纬度度数（近似值）"""
    # 纬度转换（1度≈111319.5米）
    lat_deg = meters / 111319.5
    
    # 经度转换（随纬度变化）
    lon_deg = meters / (111319.5 * np.cos(np.radians(latitude)))
    
    return lat_deg, lon_deg

def get_grid_id(lon, lat, grid_size=200):
    """将经纬度坐标分配到指定大小的网格，返回网格ID"""
    lat_deg, lon_deg = meters_to_degrees(grid_size, lat)
    grid_lat = int(lat / lat_deg)
    grid_lon = int(lon / lon_deg)
    return f"grid_{grid_lon}_{grid_lat}"

def get_grid_bounds(grid_id, grid_size=200):
    """计算网格的经纬度范围（min_lon, max_lon, min_lat, max_lat）"""
    parts = grid_id.split('_')
    if len(parts) != 3:
        return None
    
    grid_lon = int(parts[1])
    grid_lat = int(parts[2])
    
    # 使用平均纬度估算网格大小（可根据实际数据区域调整）
    avg_lat = 30  # 例如以上海地区纬度为参考
    lat_deg, lon_deg = meters_to_degrees(grid_size, avg_lat)
    
    # 计算经纬度范围
    min_lon = grid_lon * lon_deg
    max_lon = (grid_lon + 1) * lon_deg
    min_lat = grid_lat * lat_deg
    max_lat = (grid_lat + 1) * lat_deg
    
    return (round(min_lon, 6), round(max_lon, 6), 
            round(min_lat, 6), round(max_lat, 6))

def format_bounds_as_label(bounds):
    """将经纬度范围格式化为易读的标签"""
    if not bounds:
        return "未知区域"
    min_lon, max_lon, min_lat, max_lat = bounds
    return (f"[{min_lon}~{max_lon}], "
            f"[{min_lat}~{max_lat}]")

def plot_origin_destination_heatmap(nav_data, grid_size=200):
    """
    生成出发点区域与目的地导航频率热力图（函数内部不显示图像，仅返回图形对象）
    
    参数:
        nav_data: 导航数据列表
        grid_size: 网格大小（米），默认200米
        
    返回:
        matplotlib.figure.Figure: 热力图的图形对象，可用于后续显示或处理
    """
    # 设置中文显示
    plt.rcParams["font.family"] = ["Heiti TC"]
    plt.rcParams["axes.unicode_minus"] = False
    
    # 数据预处理
    frequency_data = defaultdict(lambda: defaultdict(int))
    grid_bounds = {}
    
    for item in nav_data:
        try:
            start_loc = item['start_location'].split(',')
            start_lon, start_lat = float(start_loc[0]), float(start_loc[1])
            grid_id = get_grid_id(start_lon, start_lat, grid_size)
            if grid_id not in grid_bounds:
                grid_bounds[grid_id] = get_grid_bounds(grid_id, grid_size)
            destination = item['poi']
            frequency_data[grid_id][destination] += 1
        except (KeyError, ValueError, IndexError) as e:
            print(f"处理数据项时出错：{str(e)}，跳过该数据项")
            continue
    
    if not frequency_data:
        print("没有有效的数据可处理")
        return None
    
    # 转换为DataFrame并格式化索引
    df = pd.DataFrame(frequency_data).fillna(0).T
    df.index = [format_bounds_as_label(grid_bounds[grid_id]) for grid_id in df.index]
    df = df.reindex(sorted(df.index, key=lambda x: float(x.split(", ")[1][1:].split("~")[0])))
    
    # 绘制热力图（仅构建图形，不显示）
    fig, ax = plt.subplots(figsize=(14, 10))
    max_freq = df.max().max()
    cmap = "YlOrRd" if max_freq <= 20 else "YlOrBr"
    
    sns.heatmap(
        df,
        annot=True,
        fmt='.0f',
        cmap=cmap,
        cbar_kws={'label': '导航频率'},
        linewidths=.5,
        ax=ax
    )
    
    ax.set_title(f'出发点区域（{grid_size}米×{grid_size}米）到目的地的导航频率热力图', fontsize=15)
    ax.set_xlabel('目的地', fontsize=12)
    ax.set_ylabel(f'出发点经纬度范围（{grid_size}米×{grid_size}米）', fontsize=12)
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    # 函数内部不调用plt.show()，完全由外部控制显示
    return fig

# 使用示例
if __name__ == "__main__":
    sample_data = [
        {'start_location': '121.370007,31.192397',
         'poi': '金地西郊风华',
         'type': '住宅区',
         'poi_location': '121.434522,31.2165',
         'start_time': '2025-06-20 22:43:23.708',
         'end_time': '2025-06-20 23:24:45.718'},
        {'start_location': '121.370107,31.192497',  # 同一网格
         'poi': '金地西郊风华',
         'type': '住宅区',
         'poi_location': '121.434522,31.2165',
         'start_time': '2025-06-20 20:43:23.708',
         'end_time': '2025-06-20 21:24:45.718'},
        {'start_location': '121.380007,31.182397',  # 另一网格
         'poi': '万达广场',
         'type': '商业区',
         'poi_location': '121.424522,31.2065',
         'start_time': '2025-06-20 19:43:23.708',
         'end_time': '2025-06-20 20:10:45.718'},
    ]
    
    frequency_df = plot_origin_destination_heatmap(sample_data)
    if frequency_df is not None:
        print("\n导航频率数据:")
        print(frequency_df)
