import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from scipy import stats
import sqlite3
from datetime import datetime, timedelta
import os



def calculate_CIs(data):
    # data = df[df.transport_mode == transit]
    # print(data)
    m = data.commute_duration_seconds.mean()
    
    if len(data) == 1:
        return [m / 60, 0]
    
    else:
        std = data.commute_duration_seconds.std()

        n = len(data)

        sem = std / np.sqrt(n)

        t_value = stats.t.ppf(0.975, n - 1)  # 95% CI


        ci_width = sem * t_value

        CI_lower = np.round(m / 60, 0) - np.round(ci_width / 60, 0)
        CI_upper = np.round(m / 60, 0) + np.round(ci_width / 60, 0)



        return [((CI_lower + CI_upper) / 2), (CI_upper - CI_lower)]

def time_to_seconds(time_obj):
    return time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second

def get_usernames(db_file = 'users.db'):
    conn = sqlite3.connect(db_file)
    query = '''select * from sqlite_master where type = 'table';'''
    data = pd.read_sql_query(f'''select * from users;''', conn)
    conn.close()
    return data





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
    
'''
Function to calculate CI for transit times for users.
Returns CI for a given transit type, with and without rain.
'''
def analyze_commute_data(user):
    df = get_data_from_db(username = user)   
    
    CI = {}
    # Define the list of transport modes
    transports = ['car', 'bus', 'train', 'bike', 'walk', 'other']
    precipitation = ['clear', 'rain', 'snow']
    conditions = ['dry','wet','frozen']
    for trans in transports:
        CI[trans] = {}
        for precip in precipitation:
            CI[trans][precip] = {}
            for condition in conditions:
                
                data = df[
                    (df['transport_mode'] == trans) & 
                    (df['weather'] == precip) & 
                    (df['conditions'] == condition)
                ]
                CIs = calculate_CIs(data)
                if not (np.isnan(CIs).any()): 
                    CI[trans][precip][condition] = CIs
                    
            if not CI[trans][precip]:
                del CI[trans][precip]
        if not CI[trans]:  
            del CI[trans]

                    
    return CI



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



'''
Function to count the number of seconds in commutes
Returns two dictionaries keyed by mode of transit
Dictionary values are either total or average time spent in mode of transit
'''
def count_time(data, combined = False, raining = 0):
    tot_time_dict = {}
    avg_time_dict = {}
    if combined == False:
        for trans in data.transport_mode.unique():
            df = data[
                (data.transport_mode == trans) &
                (data.raining == raining)
            ]
            
            if df.empty:
                continue
            tot_time_length = np.round(sum(df.commute_duration_seconds) / 60, 1)
            avg_time_length = np.round(((sum(df.commute_duration_seconds)/ 60) / len(df)) , 1)
            # print(f'''{trans} total, {tot_time_length} hours''')
            # print(f'''{trans} avg, {avg_time_length} hours''')
            tot_time_dict[trans] = tot_time_length
            avg_time_dict[trans] = avg_time_length
        return tot_time_dict, avg_time_dict
    
    
    
    
    
    
    elif combined == True:
        for trans in data.transport_mode.unique():
            df = data[
                (data.transport_mode == trans)
                # (data.raining == raining)
            ]
            if df.empty:
                continue
            tot_time_length = np.round(sum(df.commute_duration_seconds) / 60, 1)
            avg_time_length = np.round(((sum(df.commute_duration_seconds) / 60 )/ len(df)) , 1)
            # print(f'''{trans} total, {tot_time_length} hours''')
            # print(f'''{trans} avg, {avg_time_length} hours''')
            tot_time_dict[trans] = tot_time_length
            avg_time_dict[trans] = avg_time_length
        return tot_time_dict, avg_time_dict



def make_charts():
    
    users = get_usernames()

    data = pd.DataFrame()
    static_dir = os.path.join('static', 'images')

    for user in users.username:
        data = pd.concat([data,get_data_from_db(username = user)], axis = 0)
        
    comb_tot, comb_avg = count_time(data, combined = True)

    nr_tot, nr_avg = count_time(data, combined = False, raining = 0)

    wr_tot, wr_avg = count_time(data, combined = False, raining = 1)

    for [dict1, dict2] in [[comb_tot, comb_avg], [nr_tot, nr_avg], [wr_tot, wr_avg]]:
    
    
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 6))


        ax1.pie(
            dict1.values(),
            labels=[f"{label}\n{np.round(value, 1)}m" for label, value in dict1.items()],
            autopct='%1.1f%%',
            startangle=90,
        )
        ax2.pie(
            dict2.values(),
            labels=[f"{label}\n{np.round(value, 1)}m" for label, value in dict2.items()],
            autopct='%1.1f%%',
            startangle=90,
        )
        if dict1 == comb_tot:        
            ax1.set_title("Total Time in Transit")
            ax2.set_title("Avg Time in Transit")
            
            pth1 = os.path.join(static_dir, f'comb_data.png')
            plt.savefig(pth1, bbox_inches='tight')
            plt.close(fig)  
            
        if dict1 == nr_tot:        
            ax1.set_title("Total Time in Transit (No Rain)")
            ax2.set_title("Avg Time in Transit (No Rain)")
            pth2 = os.path.join(static_dir, f'no_rain.png')
            plt.savefig(pth2, bbox_inches='tight')
            plt.close(fig) 
            
            
            
        if dict1 == wr_tot:        
            ax1.set_title("Total Time in Transit (With Rain)")
            ax2.set_title("Avg Time in Transit (With Rain)")
            pth3 = os.path.join(static_dir, f'with_rain.png')
            plt.savefig(pth3, bbox_inches='tight')
            plt.close(fig) 
    return pth1, pth2, pth3



def make_user_charts(username):
    data = get_data_from_db(username)
    comb_tot, comb_avg = count_time(data, combined = True)
    nr_tot, nr_avg = count_time(data, combined = False, raining = 0)
    wr_tot, wr_avg = count_time(data, combined = False, raining = 1)

    static_dir = os.path.join('static', 'images')
    pth2 = os.path.join(static_dir, f'{username}_no_rain.png')
    pth3 = os.path.join(static_dir, f'{username}_with_rain.png')
    pth1 = os.path.join(static_dir, f'{username}_comb_data.png')

    # print([[comb_tot, comb_avg], [nr_tot, nr_avg], [wr_tot, wr_avg]])
    for [dict1, dict2] in [[comb_tot, comb_avg], [nr_tot, nr_avg], [wr_tot, wr_avg]]:
        # print('poopnobblers')
        # print(dict1, dict2)
        if not dict1 or not dict2:
            # print(f"Skipping empty data: {dict1} or {dict2}")
            continue
        # print('poopnobblerslectricbugalloo')

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 6))
        # print('fig created')
        # print('ax1 starting')
        ax1.pie(
            dict1.values(),
            labels=[f"{label}\n{np.round(value, 1)}m" for label, value in dict1.items()],
            autopct='%1.1f%%',
            startangle=90,
        )
        # print('ax1done')
        ax2.pie(
            dict2.values(),
            labels=[f"{label}\n{np.round(value, 1)}m" for label, value in dict2.items()],
            autopct='%1.1f%%',
            startangle=90,
        )
        # print('ax2done')

        if dict1 == comb_tot:        
            ax1.set_title("Total Time in Transit")
            ax2.set_title("Avg Time in Transit")

            plt.savefig(pth1, bbox_inches='tight')
            plt.close(fig)  

        if dict1 == nr_tot:        
            ax1.set_title("Total Time in Transit (No Rain)")
            ax2.set_title("Avg Time in Transit (No Rain)")
            plt.savefig(pth2, bbox_inches='tight')
            plt.close(fig) 



        if dict1 == wr_tot:        
            ax1.set_title("Total Time in Transit (With Rain)")
            ax2.set_title("Avg Time in Transit (With Rain)")
            plt.savefig(pth3, bbox_inches='tight')
            plt.close(fig) 
            
    return pth1, pth2, pth3
        # plt.show()


    
def make_stacked_bars(total = True):
    static_dir = os.path.join('static', 'images')
    if total == True:
        pth = os.path.join(static_dir, 'stacked_bars.png')

    else:
        pth = os.path.join(static_dir, 'avg_stacked_bars.png')
    users = get_usernames()
    data = pd.DataFrame()
    for user in users.username:
        data = pd.concat(
            [data, 
             get_data_from_db(username = user)]
        )

    weather = data.weather.unique()
    conditions = data.conditions.unique()
    transport = data.transport_mode.unique()

    dictionary = {}

    for trans in transport:
        dictionary[trans] = {}
        for weath in weather:
            dictionary[trans][weath] = {}
            for cond in conditions:
                df = data[
                    (data['transport_mode'] == trans) &
                    (data['weather'] == weath) &
                    (data['conditions'] == cond)
                ]
                if not df.empty:
                    if total == True:
                        dictionary[trans][weath][cond] = sum(df.commute_duration_seconds)
                    else:
                        dictionary[trans][weath][cond] = sum(df.commute_duration_seconds) / len(df.commute_duration_seconds)

            if not dictionary[trans][weath]:
                del dictionary[trans][weath]
        if not dictionary[trans]:
            del dictionary[trans]

    transport_modes = []
    weather_conditions = []
    road_conditions = []
    travel_times = []

    for trans, item in dictionary.items():
        for weath, item in dictionary[trans].items():
            for cond, item in dictionary[trans][weath].items():
                if not trans in transport_modes:
                    transport_modes.append(trans)
                weather_conditions.append(weath)

                road_conditions.append(cond)
                travel_times.append(item)

    # Reorganize travel times into a dictionary where the key is the transport mode
    # and the value is a list of travel times corresponding to each combination of conditions
    condition_combinations = sorted(set([f'{weather}-{road}' for weather, road in zip(weather_conditions, road_conditions)]))
    stacked_data = {mode: [0] * len(condition_combinations) for mode in transport_modes}
    for mode in transport_modes:
        for idx, condition in enumerate(condition_combinations):
            weather, road = condition.split('-')
            # Find the corresponding travel time for the current mode and condition
            travel_time = dictionary.get(mode, {}).get(weather, {}).get(road, 0) /60 
            stacked_data[mode][idx] = travel_time
    # Now plot the stacked bar chart
    fig, ax = plt.subplots()

    bottom = np.zeros(len(condition_combinations))

    # Plot the stacked bars for each transport mode
    for idx, mode in enumerate(transport_modes):
        ax.bar(condition_combinations, stacked_data[mode] , bottom=bottom, label=mode)
        bottom += np.array(stacked_data[mode])

    # Add labels and title
    ax.set_xlabel('Weather and Road Conditions')
    if total == True:
        ax.set_ylabel('Total Travel Time (minutes)')
        ax.set_title('Total Travel Time by Transport Mode and Conditions')
    else:
        ax.set_ylabel('Average Travel Time (minutes)')
        ax.set_title('Average Travel Time by Transport Mode and Conditions')
    ax.legend(title='Transport Mode')

    plt.xticks(rotation=45)
    # plt.yscale('log')
    plt.tight_layout()
    plt.savefig(pth, bbox_inches='tight')
