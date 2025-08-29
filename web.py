from flask import Flask, render_template, request
from backend.init_processed_data import init_backend_processed_data
app = Flask(__name__)


@app.route('/')
def home():
    # 获取选中的VIN码，默认使用第一个
    selected_vin = request.args.get('vin')
    print("Selected VIN:", selected_vin)
    # 处理数据
    processed_data = init_backend_processed_data(selected_vin)
    # print("Processed Data:", processed_data)
    # 传递VIN列表和处理后的数据到前端
    return render_template(
        'index.html', 
        processed_data=processed_data,
    )

if __name__ == '__main__':
    app.run(debug=True)