from flask import Flask, render_template
from get_vis import *
app = Flask(__name__)
app.config['STATIC_URL'] = '/static'
app.config['STATIC_URL_PATH'] = '/static'
app.config['STATIC_FOLDER'] = '/static'
from init_processed_data import *

@app.route('/')
def home():
    # 2. 传递数据到前端（变量名必须是processed_data）
    processed_data= init_backend_processed_data(file_path='/Users/lichen18/Documents/Project/Data_mining/data/data_for_analysis/HLX32B147R1451626.csv')
    return render_template('index.html', processed_data=processed_data)

if __name__ == '__main__':
    app.run(debug=True)  # 开启调试模式，方便查看错误