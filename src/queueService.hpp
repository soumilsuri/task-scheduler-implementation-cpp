#ifndef QUEUE_HPP
#define QUEUE_HPP

#include <queue>
#include <vector>
#include <memory>
#include "processService.hpp"
#include "queueService.hpp"

/**
 * @class QueueService
 * @brief A priority queue for managing Process objects based on their virtual runtime (vruntime).
 */
class QueueService {
private:
    /**
     * @brief Custom comparator to order processes by vruntime (lower values have higher priority).
     */
    struct Compare {
        bool operator()(Process* a, Process* b) {
            return a->vruntime > b->vruntime;
        }
    };

    std::priority_queue<Process*, std::vector<Process*>, Compare> q;

public:
    QueueService();          ///< Constructor
    void push_element(Process* p);  ///< Inserts a process into the queue
    void pop_element();      ///< Removes the highest-priority process from the queue
    bool is_empty();         ///< Checks if the queue is empty
    Process* top_element();  ///< Returns the highest-priority process without removing it
};

#endif // QUEUE_HPP
