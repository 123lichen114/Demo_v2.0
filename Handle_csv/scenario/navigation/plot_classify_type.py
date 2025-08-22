import matplotlib.pyplot as plt
from matplotlib.patches import Patch
import pandas as pd
from io import BytesIO
import numpy as np


# 定义 ArcText 类用于绘制弧形文本
class ArcText:
    def __init__(self, ax, text, center, radius, start_angle, end_angle, fontsize=12, textcolor='black'):
        self.ax = ax
        self.text = text
        self.center = center
        self.radius = radius
        self.start_angle = start_angle
        self.end_angle = end_angle
        self.fontsize = fontsize
        self.textcolor = textcolor
        self._add_text()

    def _add_text(self):
        num_chars = len(self.text)
        angle_step = (self.end_angle - self.start_angle) / num_chars
        for i, char in enumerate(self.text):
            angle = np.deg2rad(self.start_angle + i * angle_step + angle_step / 2)
            x = self.center[0] + self.radius * np.cos(angle)
            y = self.center[1] + self.radius * np.sin(angle)
            self.ax.text(x, y, char, fontsize=self.fontsize, color=self.textcolor,
                         rotation=np.rad2deg(angle) - 90, ha='center', va='center')


def plot_category_distribution(data_list):
    # 初始化 reference_dict
    reference_dict = {}
    df = pd.read_excel('/Users/lichen18/Documents/Project/Demo_v2.0/use_GaoDe_api/amap_poicode.xlsx')

    # 填充 reference_dict
    for index, row in df.iterrows():
        new_type_str = str(row['NEW_TYPE']).zfill(6)
        reference_dict[new_type_str] = {
            '大类': row['大类'],
            '中类': row['中类'],
            '小类': row['小类']
        }

    # 提取 data_list 中 end_typeCode 对应的大中小类
    categories = []
    for item in data_list:
        type_code = item['end_typeCode']
        if type_code in reference_dict:
            categories.append(reference_dict[type_code])

    # 统计各类别的数量
    big_category_count = {}
    mid_category_count = {}
    sub_category_count = {}

    for category in categories:
        big = category['大类']
        mid = category['中类']
        sub = category['小类']

        if big in big_category_count:
            big_category_count[big] += 1
        else:
            big_category_count[big] = 1

        if mid in mid_category_count:
            mid_category_count[mid] += 1
        else:
            mid_category_count[mid] = 1

        if sub in sub_category_count:
            sub_category_count[sub] += 1
        else:
            sub_category_count[sub] = 1

    # 设置图片清晰度
    plt.rcParams['figure.dpi'] = 300

    # 设置中文字体
    plt.rcParams['font.sans-serif'] = ['Heiti TC']

    # 创建画布
    fig, ax = plt.subplots(figsize=(10, 10))

    def plot_pie(labels, sizes, radius, pctdistance, colors):
        wedges, _ = ax.pie(sizes, labels=None, startangle=90, radius=radius, autopct=None,
                           pctdistance=pctdistance, colors=colors)

        total_size = sum(sizes)
        for i, (wedge, label, size) in enumerate(zip(wedges, labels, sizes)):
            theta1, theta2 = wedge.theta1, wedge.theta2
            center_angle = (theta1 + theta2) / 2
            # 将角度转换为弧度
            center_rad = center_angle * (np.pi / 180)

            # 计算合适的字体大小，这里简单根据扇形角度和半径调整
            text_angle = (theta2 - theta1) * (np.pi / 180)
            available_length = radius * text_angle
            max_chars = int(available_length / 0.1)  # 假设每个字符宽度约为 0.1
            fontsize = min(15, int(available_length / len(label)) * 2) if label else 10

            # 绘制类别文本
            if label:
                ArcText(ax, label, (0, 0), radius * 0.8, theta1, theta2, fontsize=fontsize)

            # 绘制比例文本
            percentage_text = f'{(size / total_size) * 100:.1f}%'
            if percentage_text:
                ArcText(ax, percentage_text, (0, 0), radius * 0.6, theta1, theta2, fontsize=fontsize)

        return wedges

    # 定义用于区分扇形区域的颜色列表
    big_colors = plt.cm.Paired(range(len(big_category_count)))
    mid_colors = plt.cm.Paired(range(len(big_category_count), len(big_category_count) + len(mid_category_count)))
    sub_colors = plt.cm.Paired(range(len(big_category_count) + len(mid_category_count),
                                     len(big_category_count) + len(mid_category_count) + len(sub_category_count)))

    # 绘制大类扇形图
    big_labels = list(big_category_count.keys())
    big_sizes = list(big_category_count.values())
    plot_pie(big_labels, big_sizes, 0.8, 0.85, big_colors)

    # 绘制中类扇形图
    mid_labels = list(mid_category_count.keys())
    mid_sizes = list(mid_category_count.values())
    plot_pie(mid_labels, mid_sizes, 0.6, 0.75, mid_colors)

    # 绘制小类扇形图
    sub_labels = list(sub_category_count.keys())
    sub_sizes = list(sub_category_count.values())
    plot_pie(sub_labels, sub_sizes, 0.4, 0.65, sub_colors)

    # 绘制中心空白圆
    centre_circle = plt.Circle((0, 0), 0.2, fc='white')
    ax.add_artist(centre_circle)

    # 为每个类别创建图例
    big_legend_handles = [Patch(color=color, label=label) for color, label in zip(big_colors, big_labels)]
    mid_legend_handles = [Patch(color=color, label=label) for color, label in zip(mid_colors, mid_labels)]
    sub_legend_handles = [Patch(color=color, label=label) for color, label in zip(sub_colors, sub_labels)]

    # 显示图例
    ax.legend(handles=big_legend_handles + mid_legend_handles + sub_legend_handles, loc='center left',
              bbox_to_anchor=(1, 0.5))

    # 设置图形标题
    ax.set_title('大中小类分布')

    buf = BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)

    plt.close(fig)

    return buf


if __name__ == '__main__':
    # 定义 data_list
    data_list = [
        {
            'vin': 'HLX32B143R1309094',
            'start_location': '119.575804,39.932795',
            'end_location': '119.488542,39.813902',
            'end_adcode': 130304,
            'end_typeCode': '061207',
            'end_address': '北戴河中海滩路',
            'poi': '老虎石海上公园',
            'start_time': '2025-05-18 05:56:08.925000',
            'end_time': '2025-05-18 06:42:40.925000',
            'distance': 17089,
            'duration': 2792
        },
        {
            'vin': 'ABC12345678901234',
            'start_location': '118.575804,38.932795',
            'end_location': '118.488542,38.813902',
            'end_adcode': 120304,
            'end_typeCode': '010100',
            'end_address': '某海滩路',
            'poi': '某公园',
            'start_time': '2025-05-19 07:56:08.925000',
            'end_time': '2025-05-19 08:42:40.925000',
            'distance': 15089,
            'duration': 2592
        }
    ]

    buf = plot_category_distribution(data_list)
    from PIL import Image

    # 假设 `buf` 是前面函数返回的对象
    image = Image.open(buf)
    image.show()