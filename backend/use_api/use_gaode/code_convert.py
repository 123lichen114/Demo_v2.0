import pandas as pd

def adcode_to_ad(adcode):
    map_file = 'AMap_adcode_citycode.xlsx'
    df = pd.read_excel(map_file)
    