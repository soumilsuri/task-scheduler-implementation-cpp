import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import json
from matplotlib.patches import Rectangle
from matplotlib.colors import LinearSegmentedColormap
import matplotlib.gridspec as gridspec

def load_processes(json_file_path):
    """Load and parse the process data from a JSON file"""
    with open(json_file_path, 'r') as f:
        return json.load(f)

def create_process_info_table(processes):
    """Extract process information into a DataFrame for display"""
    process_info = []
    for p in processes:
        process_info.append({
            'PID': p['pid'],
            'Priority': p['priority'],
            'vRuntime': p['vruntime'],
            'CPU Burst': p['cpu_burst_time'],
            'Counter': p['processState']['counter'],
            'Nature': p['processNature']
        })
    return pd.DataFrame(process_info)

def analyze_schedule(df):
    """Analyze the schedule for metrics and statistics"""
    # Calculate execution time per process
    process_times = df.copy()
    process_times['execution_time'] = process_times['end_time'] - process_times['start_time']
    
    # Group by PID to get total execution time per process
    total_times = process_times.groupby('pid')['execution_time'].sum().reset_index()
    total_times.columns = ['pid', 'total_execution_time']
    
    # Count switches per process
    switch_counts = process_times['pid'].value_counts().reset_index()
    switch_counts.columns = ['pid', 'context_switches']
    
    # Calculate average execution time per burst
    avg_burst = process_times.groupby('pid')['execution_time'].mean().reset_index()
    avg_burst.columns = ['pid', 'avg_burst_time']
    
    # Merge all metrics
    metrics = pd.merge(total_times, switch_counts, on='pid')
    metrics = pd.merge(metrics, avg_burst, on='pid')
    
    return metrics

def visualize_cfs_schedule(schedule_file, process_data=None, output_file='cfs_visualization.png'):
    """Create a comprehensive visualization of the CFS schedule"""
    # Read the scheduling data
    df = pd.read_csv(schedule_file)
    
    # Calculate normalized times to make visualization more readable
    min_time = df['start_time'].min()
    df['normalized_start'] = (df['start_time'] - min_time) / 1e6  # Convert to milliseconds
    df['normalized_end'] = (df['end_time'] - min_time) / 1e6
    df['duration'] = df['normalized_end'] - df['normalized_start']
    
    # Get unique PIDs and set color map
    unique_pids = sorted(df['pid'].unique())
    num_processes = len(unique_pids)
    
    # Create a custom colormap with distinct colors
    colors = plt.cm.viridis(np.linspace(0, 1, num_processes))
    pid_colors = {pid: colors[i] for i, pid in enumerate(unique_pids)}
    
    # If we have process metadata, use it for enhanced visualization
    process_nature = {}
    if process_data:
        for p in process_data:
            process_nature[p['pid']] = p['processNature']
    
    # Create figure with subplots using GridSpec for custom layout
    fig = plt.figure(figsize=(14, 10), dpi=100, facecolor='#f5f5f5')
    gs = gridspec.GridSpec(3, 2, height_ratios=[1, 2, 1])
    
    # 1. Top left: Process summary (if we have process data)
    ax_summary = None
    if process_data:
        ax_summary = fig.add_subplot(gs[0, 0])
        process_info = create_process_info_table(process_data)
        
        # Create a table visualization
        cell_text = []
        for _, row in process_info.iterrows():
            cell_text.append([row['PID'], row['Priority'], row['Nature'], 
                             row['CPU Burst'], row['vRuntime']])
        
        table = ax_summary.table(cellText=cell_text,
                               colLabels=['PID', 'Priority', 'Type', 'CPU Burst', 'vRuntime'],
                               loc='center',
                               cellLoc='center')
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1.2, 1.2)
        
        # Color rows by process type
        for i, row in enumerate(cell_text):
            pid = int(row[0])
            table[(i+1, 0)].set_facecolor(pid_colors[pid])
            for j in range(1, len(row)):
                cell_color = 'lightblue' if process_nature.get(pid) == 'IO_BOUND' else 'lightyellow'
                table[(i+1, j)].set_facecolor(cell_color)
                
        ax_summary.set_title('Process Information', fontsize=12, pad=20)
        ax_summary.axis('off')
    
    # 2. Top right: Metrics visualization
    ax_metrics = fig.add_subplot(gs[0, 1])
    metrics = analyze_schedule(df)
    
    # Create grouped bar chart for metrics
    bar_width = 0.25
    x = np.arange(len(metrics['pid']))
    
    # Normalize metrics for comparison
    metrics['norm_time'] = metrics['total_execution_time'] / metrics['total_execution_time'].max()
    metrics['norm_switches'] = metrics['context_switches'] / metrics['context_switches'].max()
    metrics['norm_burst'] = metrics['avg_burst_time'] / metrics['avg_burst_time'].max()
    
    ax_metrics.bar(x - bar_width, metrics['norm_time'], width=bar_width, 
                 label='Relative Execution Time', color='forestgreen', alpha=0.7)
    ax_metrics.bar(x, metrics['norm_switches'], width=bar_width, 
                 label='Relative Context Switches', color='crimson', alpha=0.7)
    ax_metrics.bar(x + bar_width, metrics['norm_burst'], width=bar_width, 
                 label='Relative Avg Burst', color='royalblue', alpha=0.7)
    
    ax_metrics.set_xticks(x)
    ax_metrics.set_xticklabels([f'PID {pid}' for pid in metrics['pid']])
    ax_metrics.set_title('Process Metrics (Normalized)', fontsize=12)
    ax_metrics.legend(fontsize=8)
    ax_metrics.grid(axis='y', linestyle='--', alpha=0.7)
    
    # 3. Main timeline visualization (central panel)
    ax_timeline = fig.add_subplot(gs[1, :])
    
    # Add process execution blocks
    for _, row in df.iterrows():
        pid = row['pid']
        start = row['normalized_start']
        end = row['normalized_end']
        duration = end - start
        
        # Skip blocks that are too small to see
        if duration < 0.01:
            continue
            
        color = pid_colors[pid]
        
        # Add slight transparency to see overlaps if they exist
        rect = Rectangle((start, pid-0.4), duration, 0.8, 
                         color=color, alpha=0.8, ec='black', lw=0.5)
        ax_timeline.add_patch(rect)
    
    # Customize timeline
    ax_timeline.set_yticks(unique_pids)
    ax_timeline.set_yticklabels([f'Process {pid}' for pid in unique_pids])
    
    # Add nature indicator if we have process data - using text instead of emoji
    if process_data:
        for pid in unique_pids:
            if pid in process_nature:
                nature = process_nature[pid]
                # Use text indicators instead of emoji
                indicator = "[IO]" if nature == "IO_BOUND" else "[CPU]"
                ax_timeline.text(-5, pid, indicator, fontsize=9, ha='right', va='center')
    
    ax_timeline.set_xlabel('Time (ms from start)', fontsize=11)
    ax_timeline.set_title('CFS Scheduling Timeline', fontsize=14)
    ax_timeline.grid(axis='x', linestyle='--', alpha=0.4)
    
    # Set reasonable x limits based on the data
    ax_timeline.set_xlim(-10, df['normalized_end'].max() * 1.05)
    
    # 4. Bottom panel: Process activity heatmap
    ax_heatmap = fig.add_subplot(gs[2, :])
    
    # Create time bins for the heatmap
    max_time = df['normalized_end'].max()
    num_bins = 100
    bin_edges = np.linspace(0, max_time, num_bins + 1)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    
    # Count active processes in each time bin
    process_activity = np.zeros((len(unique_pids), num_bins))
    
    for pid_idx, pid in enumerate(unique_pids):
        pid_data = df[df['pid'] == pid]
        
        for _, row in pid_data.iterrows():
            start_bin = np.searchsorted(bin_edges, row['normalized_start']) - 1
            end_bin = np.searchsorted(bin_edges, row['normalized_end'])
            
            # Ensure valid indices
            start_bin = max(0, start_bin)
            end_bin = min(num_bins, end_bin)
            
            process_activity[pid_idx, start_bin:end_bin] = 1
    
    # Plot heatmap
    im = ax_heatmap.imshow(process_activity, aspect='auto', cmap='inferno', 
                         extent=[0, max_time, 0.5, len(unique_pids) + 0.5])
    
    # Customize heatmap
    ax_heatmap.set_yticks(np.arange(1, len(unique_pids) + 1))
    ax_heatmap.set_yticklabels([f'PID {pid}' for pid in unique_pids])
    ax_heatmap.set_xlabel('Time (ms from start)', fontsize=11)
    ax_heatmap.set_title('Process Activity Heatmap', fontsize=12)
    
    # Add colorbar
    cbar = plt.colorbar(im, ax=ax_heatmap, orientation='vertical', pad=0.01)
    cbar.set_label('Process Active', fontsize=10)
    cbar.set_ticks([0, 1])
    cbar.set_ticklabels(['Inactive', 'Active'])
    
    # Finalize the figure
    plt.suptitle('CFS Scheduler Visualization', fontsize=16, y=0.98)
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    
    return fig

def extract_processes_from_json_string(json_string):
    """Extract process information from a JSON string if file not available"""
    try:
        return json.loads(json_string)
    except json.JSONDecodeError:
        return None

if __name__ == "__main__":
    # Example usage
    schedule_file = 'process_schedule.csv'
    json_file = r'resources\process.json'
    
    # Try to load process data from JSON file
    try:
        processes = load_processes(json_file)
        fig = visualize_cfs_schedule(schedule_file, processes, 'cfs_advanced_visualization.png')
    except FileNotFoundError:
        # If JSON file not found, try to create it from the JSON data in the code
        json_string = """[
    {
        "pid": 1,
        "vruntime": 8,
        "cpu_burst_time": 30,
        "priority": 1,
        "processState": {
            "counter": 120
        },
        "processNature": "IO_BOUND"
    },
    {
        "pid": 2,
        "vruntime": 12,
        "cpu_burst_time": 70,
        "priority": 2,
        "processState": {
            "counter": 40
        },
        "processNature": "CPU_BOUND"
    },
    {
        "pid": 3,
        "vruntime": 14,
        "cpu_burst_time": 50,
        "priority": 3,
        "processState": {
            "counter": 90
        },
        "processNature": "IO_BOUND"
    },
    {
        "pid": 4,
        "vruntime": 18,
        "cpu_burst_time": 80,
        "priority": 2,
        "processState": {
            "counter": 30
        },
        "processNature": "CPU_BOUND"
    },
    {
        "pid": 5,
        "vruntime": 10,
        "cpu_burst_time": 40,
        "priority": 1,
        "processState": {
            "counter": 110
        },
        "processNature": "IO_BOUND"
    },
    {
        "pid": 6,
        "vruntime": 20,
        "cpu_burst_time": 95,
        "priority": 3,
        "processState": {
            "counter": 20
        },
        "processNature": "CPU_BOUND"
    },
    {
        "pid": 7,
        "vruntime": 16,
        "cpu_burst_time": 35,
        "priority": 1,
        "processState": {
            "counter": 75
        },
        "processNature": "IO_BOUND"
    },
    {
        "pid": 8,
        "vruntime": 22,
        "cpu_burst_time": 60,
        "priority": 2,
        "processState": {
            "counter": 50
        },
        "processNature": "CPU_BOUND"
    }
]"""
        processes = extract_processes_from_json_string(json_string)
        
        # Create the JSON file for future use
        with open(json_file, 'w') as f:
            f.write(json_string)
        
        fig = visualize_cfs_schedule(schedule_file, processes, 'cfs_advanced_visualization.png')
    
    plt.show()