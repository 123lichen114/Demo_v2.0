from flask import Flask, render_template
from get_vis import *
app = Flask(__name__)
app.config['STATIC_URL'] = 'static'
app.config['STATIC_FOLDER'] = 'static'
import pandas as pd
file_path = '/Users/lichen18/Documents/Project/Data_mining/data/data_for_analysis/HLX32B143R1309094.csv'
df = pd.read_csv(file_path)
navigation_info = df_to_navigation_info(df)

# 1. 处理后的标签值（确保与前端标签的category和title完全匹配）
processed_data = {
    "tags": [
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
    ],
    "custom_data": {
        # 从你的自定义模块获取数据，这里是示例
        "basic": 0,          # 假设返回基本信息相关数据
        "time": get_route_chart(navigation_info),        # 假设返回时间分析数据
        "space": 0, # 假设返回空间可视化数据
        "destination": 0, # 目的地统计
        "commute-basic": 0,
        "commute-space": 0,
        "work-habit": 0
    }
}

@app.route('/')
def home():
    # 2. 传递数据到前端（变量名必须是processed_data）
    return render_template('index.html', processed_data=processed_data)

if __name__ == '__main__':
    app.run(debug=True)  # 开启调试模式，方便查看错误