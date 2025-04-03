#include <iostream>
#include "src/processService.hpp"
#include <vector>
#include "src/processLog.hpp"
#include "src/cfs.hpp"
#include <fstream>

int main(int argv, char* argc[]) {
    // Load processes from a JSON file
    std::vector<Process*> processes = getProcessFromJson("../resources/process.json");
    
    // Initialize the Completely Fair Scheduler (CFS)
    cfs scheduler;
    std::vector<ProcessLog*> logs = scheduler.schedule(processes);
    
    // Open CSV file for writing process execution logs
    std::ofstream outFile("../process_schedule.csv");
    outFile << "pid,start_time,end_time" << std::endl;

    // Write execution logs to the CSV file
    for(auto processLog: logs) {
        outFile << processLog->pid << ","
                << processLog->startTime << ","
                << processLog->endTime << std::endl;
    }
    
    outFile.close();
    return 0;
}

// Higher-priority = smaller number
// Lower-priority = larger number