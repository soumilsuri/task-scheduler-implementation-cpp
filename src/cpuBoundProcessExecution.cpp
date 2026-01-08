#include "processService.hpp"
#include "queueService.hpp"
#include <memory>
#include <iostream>
#include "cpuBoundProcessExecution.hpp"
#include <cmath>

constexpr int NICE_0_LOAD = 1024;  // Standard Linux scheduler load for priority 0

/**
 * @brief Computes the weight based on process priority.
 * @param priority The priority of the process.
 * @return The computed weight value.
 */
double weightFunction(int priority) {
    return NICE_0_LOAD * std::pow(1.25, -priority);
}

/**
 * @brief Simulates execution of a CPU-bound process for a given time slice.
 * 
 * @param process Pointer to the process being executed.
 * @param timeSlice The allocated time slice for execution.
 * @param q Reference to the process queue.
 */
void executeCpuBoundProcess(Process* process, int timeSlice, QueueService &q) {
    const int executedTime = std::min(timeSlice, process->cpu_burst_time);
    
    // Reduce remaining CPU burst time
    process->cpu_burst_time -= executedTime;
    
    // Update virtual runtime based on process priority
    const double weight = weightFunction(process->priority);
    process->vruntime += (executedTime * NICE_0_LOAD) / weight;
    
    // If process still has remaining execution time, reinsert it into the queue
    if (process->cpu_burst_time > 0) {
        q.push_element(process);
    }
}
