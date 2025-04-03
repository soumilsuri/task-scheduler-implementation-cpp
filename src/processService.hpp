#ifndef PROCESS_HPP
#define PROCESS_HPP

#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <stdexcept>
#include "../nlohmann/json.hpp"

using json = nlohmann::json;

enum PROCESS_NATURE {
    CPU_BOUND,
    IO_BOUND
};

struct ProcessState {
    long long counter;
};

struct Process {
    int pid;
    long long int vruntime;
    int cpu_burst_time;
    int priority;
    ProcessState processState;
    PROCESS_NATURE processNature;
};

// Converts a string to PROCESS_NATURE enum
PROCESS_NATURE stringToProcessNature(const std::string& nature);

// Parses a JSON file to extract process information
std::vector<Process*> getProcessFromJson(const std::string& filePath);

#endif // PROCESS_HPP
