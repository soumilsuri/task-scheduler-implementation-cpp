#include <vector>
#include <chrono>
#include "processService.hpp"
#include "processLog.hpp"
#include "queueService.hpp"
#include "cpuBoundProcessExecution.hpp"
#include "ioBoundProcessExecution.hpp"
#include "cfs.hpp"

/**
 * @brief Creates a log entry for a process execution.
 * 
 * @param logs Reference to the vector storing process logs.
 * @param startTime Start time of the process execution.
 * @param endTime End time of the process execution.
 * @param pid Process ID.
 */
void cfs::createProcessLog(std::vector<ProcessLog *> &logs, long long startTime, long long endTime, int pid) {
    ProcessLog *p = new ProcessLog();
    p->pid = pid;
    p->startTime = startTime;
    p->endTime = endTime;
    logs.push_back(p);
}

/**
 * @brief Implements the Completely Fair Scheduler (CFS) algorithm.
 * 
 * @param processList List of processes to be scheduled.
 * @return A vector of process logs detailing execution times.
 */
std::vector<ProcessLog *> cfs::schedule(std::vector<Process *> processList) {
    QueueService queue;
    std::vector<ProcessLog *> logs;

    // Add all processes to the scheduling queue
    for (auto process : processList) {
        queue.push_element(process);
    }

    // Process execution loop
    while (!queue.is_empty()) {
        Process *process = queue.top_element();
        queue.pop_element();

        auto startTime = std::chrono::steady_clock::now();

        // Execute based on process nature (CPU-bound or I/O-bound)
        if (process->processNature == PROCESS_NATURE::CPU_BOUND) {
            executeCpuBoundProcess(process, 1, queue);
        } else {
            handleIoBoundProcess(process, 10, queue);
        }

        auto endTime = std::chrono::steady_clock::now();

        // Convert timestamps to nanoseconds
        long long startTimeMs = std::chrono::duration_cast<std::chrono::nanoseconds>(startTime.time_since_epoch()).count();
        long long endTimeMs = std::chrono::duration_cast<std::chrono::nanoseconds>(endTime.time_since_epoch()).count();

        // Log process execution
        createProcessLog(logs, startTimeMs, endTimeMs, process->pid);
    }

    return logs;
}
