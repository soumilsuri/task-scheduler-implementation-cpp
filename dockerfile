# Use Ubuntu 24.04 LTS as the base image - it has CMake >= 3.28.3 and Python 3.12
FROM ubuntu:24.04

LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="CFS Scheduler C++ application with Python visualization"

# Install necessary dependencies using apt
# - build-essential: for make, g++, etc.
# - cmake: required version >= 3.28.3 is available in Ubuntu 24.04 repos
# - python3, python3-pip: for the plotting script
# - python3-pandas, python3-matplotlib, python3-numpy: Python libs (install via apt to avoid PEP 668)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    python3 \
    python3-pip \
    python3-pandas \
    python3-matplotlib \
    python3-numpy \
    # Clean up apt cache
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy the entire project context (including src, resources, CMakeLists.txt, main.cpp, plot.py)
COPY . /app/

# Build the C++ application
# Create build dir, cd into it, run cmake, run make
RUN mkdir build && \
    cd build && \
    cmake .. && \
    make

# --- Runtime ---
# The CMD will execute when the container starts.
# 1. Run the compiled C++ scheduler (needs to be run from build dir for paths in main.cpp to work)
#    - It reads ../resources/process.json (i.e., /app/resources/process.json)
#    - It writes ../process_schedule.csv (i.e., /app/process_schedule.csv)
# 2. Run the Python plotting script (run from /app)
#    - It reads process_schedule.csv (i.e., /app/process_schedule.csv)
#    - It reads resources/process.json (i.e., /app/resources/process.json)
#    - It writes cfs_advanced_visualization.png (i.e., /app/cfs_advanced_visualization.png)
# 3. Print a message indicating completion and location of output.
CMD ["sh", "-c", "\
    echo '--- Running C++ CFS Scheduler ---' && \
    cd /app/build && ./cfs_scheduler && \
    echo '--- C++ Scheduler Finished ---' && \
    echo '--- Running Python Plotter ---' && \
    cd /app && python3 plot.py && \
    echo '--- Python Plotter Finished ---' && \
    echo '***' && \
    echo 'Output files generated in /app:' && \
    echo '  - /app/process_schedule.csv' && \
    echo '  - /app/cfs_advanced_visualization.png' && \
    echo '***' && \
    echo 'To copy the plot out, run:' && \
    echo 'docker cp <container_id>:/app/cfs_advanced_visualization.png .' && \
    # Keep container running for a bit if needed, or just exit. Exit is fine.
    exit 0 \
"]

# Note: plot.py has plt.show() at the end, which won't work in a non-interactive container CMD.
# It will likely just save the file and exit, which is the desired behavior here.
# If you encounter issues with matplotlib backend, you might need to add:
# ENV MPLBACKEND=Agg
# near the top of the Dockerfile.