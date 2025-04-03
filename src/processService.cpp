#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <stdexcept>
#include "../nlohmann/json.hpp"
#include "processService.hpp"

/**
 * @brief Converts a string to the corresponding PROCESS_NATURE enum.
 * @param nature String representation of the process nature.
 * @return PROCESS_NATURE enum value.
 * @throws std::invalid_argument if the string does not match a valid nature.
 */
PROCESS_NATURE stringToProcessNature(const std::string& nature) {
    if (nature == "CPU_BOUND") return PROCESS_NATURE::CPU_BOUND;
    if (nature == "IO_BOUND") return PROCESS_NATURE::IO_BOUND;
    throw std::invalid_argument("Invalid PROCESS_NATURE value");
}

/**
 * @brief Reads process information from a JSON file and constructs a list of Process objects.
 * @param filePath Path to the JSON file containing process data.
 * @return Vector of dynamically allocated Process pointers.
 * @throws std::runtime_error if the file cannot be opened.
 */
std::vector<Process*> getProcessFromJson(const std::string& filePath) {
    std::ifstream file(filePath);
    if (!file.is_open()) {
        throw std::runtime_error("Unable to open file: " + filePath);
    }

    json processesJson;
    file >> processesJson;
    file.close();

    std::vector<Process*> processes;
    for (const auto& item : processesJson) {
        Process *process = new Process();
        process->pid = item["pid"];
        process->vruntime = item["vruntime"];
        process->cpu_burst_time = item["cpu_burst_time"];
        process->priority = item["priority"];
        process->processState.counter = item["processState"]["counter"];
        process->processNature = stringToProcessNature(item["processNature"]);
        processes.push_back(process);
    }

    return processes;
}
