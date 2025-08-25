import os
from flask import Flask, render_template, request
from backend.init_processed_data import init_backend_processed_data,get_vin_list

app = Flask(__name__)


@app.route('/')
def home():
    # 获取选中的VIN码，默认使用第一个
    print('called')
    selected_vin = request.args.get('vin')
    print("Selected VIN:", selected_vin)
    vin_list = get_vin_list()
    # 配置CSV文件所在目录
    CSV_DIRECTORY = '/Users/lichen18/Documents/Project/Data_mining/data/data_for_analysis/'
    # 确定要处理的文件路径
    if selected_vin and f"{selected_vin}.csv" in os.listdir(CSV_DIRECTORY):
        print("yes")
        file_path = os.path.join(CSV_DIRECTORY, f"{selected_vin}.csv")
    elif vin_list:  # 如果有VIN列表但未选择，使用第一个
        file_path = os.path.join(CSV_DIRECTORY, f"{vin_list[0]}.csv")
    else:
        file_path = ''  # 处理无文件的情况
    
    # print("File path to process:", file_path)
    # 处理数据
    processed_data = init_backend_processed_data(file_path) if file_path else {}
    processed_data['vinList'] = vin_list
    processed_data['selectedVin'] = selected_vin
    # print("Processed Data:", processed_data)
    # 传递VIN列表和处理后的数据到前端
    return render_template(
        'index.html', 
        processed_data=processed_data,
    )

if __name__ == '__main__':
    app.run(debug=True)