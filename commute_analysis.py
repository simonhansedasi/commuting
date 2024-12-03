import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from scipy import stats
import sqlite3
from datetime import datetime, timedelta
import os



def calculate_CIs(data):
    # data = df[df.transport_mode == transit]
     
    m = data.commute_duration_seconds.mean()
    
    std = data.commute_duration_seconds.std()
    
    n = len(data)
    
    sem = std / np.sqrt(n)
    
    t_value = stats.t.ppf(0.975, n - 1)  # 95% CI
    
    
    ci_width = sem * t_value
    
    CI_lower = np.round(m / 60) - np.round(ci_width / 60)
    CI_upper = np.round(m / 60) + np.round(ci_width / 60)
    

    
    return [CI_lower, CI_upper]
def time_to_seconds(time_obj):
    return time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second


def get_data_from_db(username = 'she',db_file = 'commute_data.db'):
    # Your logic to connect to the database, fetch data, and return the dataframe
    
    conn = sqlite3.connect(db_file)
    
    query = '''select * from commute where username = ? '''
    
    df = pd.read_sql_query(query, conn, params = (username,))
    
    conn.close()
    
    

    
    time_format = '%H:%M'
    df['start_time'] = pd.to_datetime(df['start_time'], format=time_format).dt.time
    df['end_time'] = pd.to_datetime(df['end_time'], format=time_format).dt.time
    # Convert start_time and end_time to seconds
    df['start_time_seconds'] = df['start_time'].apply(time_to_seconds)
    df['end_time_seconds'] = df['end_time'].apply(time_to_seconds)
    def adjust_for_midnight(row):
        # If end_time_seconds is less than start_time_seconds, it means we passed midnight
        if row['end_time_seconds'] < row['start_time_seconds']:
            # Add 24 hours (86400 seconds) to the end_time_seconds to simulate the next day
            row['end_time_seconds'] += 86400
        return row

    df = df.apply(adjust_for_midnight, axis=1)
    # Calculate commute duration in seconds
    df['commute_duration_seconds'] = df['end_time_seconds'] - df['start_time_seconds']
    
    
    return df
    

def analyze_commute_data(user):
    df = get_data_from_db(username = user)   
    
    avg_wrc = {}  # For raining cases
    avg_nrc = {}  # For non-raining cases

    # Define the list of transport modes
    transports = ['car', 'bus', 'train', 'bike', 'walk']

    # Loop over each transport mode and calculate CIs for rainy and non-rainy conditions
    for trans in transports:
        # Calculate CI for when it's raining
        trans_CI_wrc = calculate_CIs(df[
            (df['transport_mode'] == trans) & (df['raining'] == 1)
        ])
        avg_wrc[trans] = trans_CI_wrc

        trans_CI_nrc = calculate_CIs(df[
            (df['transport_mode'] == trans) & (df['raining'] == 0)
        ])
        avg_nrc[trans] = trans_CI_nrc
    return avg_wrc, avg_nrc



def plot_pie(user):
    df = get_data_from_db(username=user)
    df1 = df[df['raining'] == 1]
    df2 = df[df['raining'] == 0]

    transport_counts1 = df1['transport_mode'].value_counts()
    transport_counts2 = df2['transport_mode'].value_counts()

    static_dir = os.path.join('static', 'images')
    os.makedirs(static_dir, exist_ok=True)  

    fig1, ax1 = plt.subplots(figsize=(6, 6))
    ax1.pie(
        transport_counts1,
        labels=transport_counts1.index,
        autopct='%1.1f%%',
        startangle=90,
        # colors=plt.cm.Paired.colors[:len(transport_counts1)],  # Custom color palette
    )
    ax1.set_title("Modes of Transport (Raining)")
    chart_path1 = os.path.join(static_dir, f'{user}_pie_with_rain.png')
    plt.savefig(chart_path1, bbox_inches='tight')
    plt.close(fig1)  # Close figure to free memory

    # Plot the second pie chart (no rain)
    fig2, ax2 = plt.subplots(figsize=(6, 6))
    ax2.pie(
        transport_counts2,
        labels=transport_counts2.index,
        autopct='%1.1f%%',
        startangle=90,
        # colors=plt.cm.Paired.colors[:len(transport_counts2)],  # Custom color palette
    )
    ax2.set_title("Modes of Transport (Not Raining)")
    chart_path2 = os.path.join(static_dir, f'{user}_pie_no_rain.png')
    plt.savefig(chart_path2, bbox_inches='tight')
    plt.close(fig2)  # Close figure to free memory

    return f'/static/images/{user}_pie_with_rain.png', f'/static/images/{user}_pie_no_rain.png'






