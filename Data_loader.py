
def df_to_navigation_info(df,config = None)->list[dict]:
    navigation_info = []
    for index, row in df.iterrows():
        info = {
            'vin': row['vin'],
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