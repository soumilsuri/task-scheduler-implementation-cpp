#include "ioBoundProcessExecution.hpp"
#include <thread>

constexpr int NICE_0_LOAD = 1024;  // Standard Linux nice value

/**
 * @brief Handles execution of an I/O-bound process by simulating I/O wait and updating scheduling properties.
 * 
 * @param process Pointer to the I/O-bound process.
 * @param ioWaitTime The time the process spends waiting for I/O operations.
 * @param q Reference to the process queue for rescheduling.
 */


void handleIoBoundProcess(Process* process, int ioWaitTime, QueueService& q) {
    // Simulate I/O wait time
    std::this_thread::sleep_for(std::chrono::milliseconds(ioWaitTime));
    
    // Calculate weight based on priority
    const double weight = weightFunction(process->priority);
    
    // Update virtual runtime to reflect I/O wait penalty (lower priority gets higher vruntime increase)
    process->vruntime += (ioWaitTime * NICE_0_LOAD) / weight;
    
    // Simulate minimal CPU execution after I/O completion
    const int executedTime = 1;  // Assume one CPU time slice is used
    process->cpu_burst_time -= executedTime;

    // Update vruntime for CPU execution portion
    process->vruntime += (executedTime * NICE_0_LOAD) / weight;
    
    // Reinsert process into queue if it still has CPU burst time remaining
    if (process->cpu_burst_time > 0) {
        q.push_element(process);
    }
}
