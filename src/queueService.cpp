#include <iostream>
#include <queue>
#include <vector>
#include <memory>
#include "processService.hpp"
#include "queueService.hpp"

QueueService::QueueService() {
    // Constructor: Initializes an empty priority queue
}

void QueueService::push_element(Process *p) {
    q.push(p);  // Adds a process to the priority queue
}

void QueueService::pop_element() {
    q.pop();  // Removes the highest-priority process from the queue
}

bool QueueService::is_empty() {
    return q.empty();  // Returns true if the queue is empty
}

Process* QueueService::top_element() {
    return q.top();  // Returns the highest-priority process without removing it
}
