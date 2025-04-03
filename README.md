# task-scheduler-implementation-cpp

This project is a C++ task scheduler that uses the Completely Fair Scheduler (CFS) algorithm. It supports two approaches for setup and execution:

1. **Using Docker (Recommended)**
2. **Manual Setup on Windows with MSYS2 & MinGW-w64**

---

## **1st Approach: Using Docker (Recommended)**

Docker provides a simple and reproducible environment for building and running the scheduler.

### **Prerequisites**
- Install [Docker](https://docs.docker.com/get-docker/)
- Install [Docker Compose](https://docs.docker.com/compose/install/)

### **Steps to Build and Run**

1. Clone the repository:
   ```sh
   git clone https://github.com/YOUR_USERNAME/task-scheduler-cpp.git
   cd task-scheduler-cpp
   ```

2. Build and run the project using Docker Compose:
   ```sh
   docker-compose up --build
   ```

3. Once execution completes, the output files will be available in the `output` folder on your host machine:
   - `output/process_schedule.csv`
   - `output/cfs_advanced_visualization.png`

4. If you need to retrieve the plot manually, use:
   ```sh
   docker cp <container_id>:/app/output/cfs_advanced_visualization.png .
   ```

---

## **2nd Approach: Manual Setup on Windows**

If you prefer to build the project manually on Windows, follow these steps.

### **1. Install MSYS2 and MinGW-w64**

1. Download MSYS2 from [MSYS2 website](https://www.msys2.org/).
2. Install it and open **MSYS2 MinGW 64-bit** terminal (**not MSYS or UCRT**).
3. Update package manager:
   ```sh
   pacman -Syu
   ```
4. Close the terminal and reopen it, then install required packages:
   ```sh
   pacman -S --needed base-devel mingw-w64-x86_64-toolchain mingw-w64-x86_64-cmake mingw-w64-x86_64-make
   ```

### **2. Add MinGW to System PATH**

1. Press **Win + R**, type `sysdm.cpl`, and press **Enter**.
2. Go to **Advanced** → Click **Environment Variables**.
3. Under **System Variables**, edit the `Path` variable and add:
   ```
   C:\msys64\mingw64\bin
   ```
4. Click **OK**, then restart **PowerShell** or **Command Prompt**.

To verify:
```sh
mingw32-make --version
```

### **3. Clone the Repository**

```sh
git clone https://github.com/YOUR_USERNAME/task-scheduler-cpp.git
cd task-scheduler-cpp
```

### **4. Build the Project**

```sh
mkdir build && cd build
cmake .. -G "MinGW Makefiles"
mingw32-make
```

### **5. Run the Program**

```sh
./cfs_scheduler
```

### **6. Generate Visualization**

1. Create and activate a Python virtual environment:
   ```sh
   python -m venv .venv
   source .venv/bin/activate  # On Windows, use .venv\Scripts\activate
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run the plotting script:
   ```sh
   python plot.py
   ```

---

## **Troubleshooting**

**Issue:** `make: command not found`
**Solution:** Install `mingw-w64-x86_64-make`:
```sh
pacman -S --needed mingw-w64-x86_64-make
```

**Issue:** `cmake: No usable generator found`
**Solution:** Run CMake with the correct generator:
```sh
cmake .. -G "MinGW Makefiles"
```

**Issue:** `mingw32-make is not recognized`
**Solution:** Ensure MinGW is in your PATH (**Step 2** above).

---

## **Contact**

For any issues, feel free to open an issue on GitHub or reach out.