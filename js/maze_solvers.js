"use strict";

function distance(point_1, point_2) {
    return Math.sqrt(Math.pow(point_2[0] - point_1[0], 2) + Math.pow(point_2[1] - point_1[1], 2));
}

function get_neighbours(cell, distance) {
    let up = [cell[0], cell[1] - distance];
    let right = [cell[0] + distance, cell[1]];
    let down = [cell[0], cell[1] + distance];
    let left = [cell[0] - distance, cell[1]];
    return [up, right, down, left];
}

function maze_solvers_interval() {
    my_interval = window.setInterval(function() {
        if (!path) {
            place_to_cell(node_list[node_list_index][0], node_list[node_list_index][1]).classList.add("cell_algo");
            node_list_index++;

            if (node_list_index == node_list.length) {
                if (!found)
                    clearInterval(my_interval);
                else {
                    path = true;
                    place_to_cell(start_pos[0], start_pos[1]).classList.add("cell_path");
                }
            }
        } else {
            if (path_list_index == path_list.length) {
                place_to_cell(target_pos[0], target_pos[1]).classList.add("cell_path");
                clearInterval(my_interval);
                onMazeSolved(); // Call this when the maze is fully solved and visualized
                return;
            }

            place_to_cell(path_list[path_list_index][0], path_list[path_list_index][1]).classList.remove("cell_algo");
            place_to_cell(path_list[path_list_index][0], path_list[path_list_index][1]).classList.add("cell_path");
            path_list_index++;
        }
    }, 10);
}

function breadth_first() {
    node_list = [];
    node_list_index = 0;
    path_list = [];
    path_list_index = 0;
    found = false;
    path = false;
    let frontier = [start_pos];
    console.log(start_pos);
    grid[start_pos[0]][start_pos[1]] = 1;

    do {
        let list = get_neighbours(frontier[0], 1);
        frontier.splice(0, 1);

        for (let i = 0; i < list.length; i++)
            if (get_node(list[i][0], list[i][1]) == 0) {
                frontier.push(list[i]);
                grid[list[i][0]][list[i][1]] = i + 1;

                if (list[i][0] == target_pos[0] && list[i][1] == target_pos[1]) {
                    found = true;
                    break;
                }

                node_list.push(list[i]);
            }
    } while (frontier.length > 0 && !found);

    if (found) {
        let current_node = target_pos;

        while (current_node[0] != start_pos[0] || current_node[1] != start_pos[1]) {
            switch (grid[current_node[0]][current_node[1]]) {
                case 1: current_node = [current_node[0], current_node[1] + 1]; break;
                case 2: current_node = [current_node[0] - 1, current_node[1]]; break;
                case 3: current_node = [current_node[0], current_node[1] - 1]; break;
                case 4: current_node = [current_node[0] + 1, current_node[1]]; break;
                default: break;
            }

            path_list.push(current_node);
        }

        path_list.pop();
        path_list.reverse();
    }

    maze_solvers_interval();
}

function depth_first() {
    // Initialize global variables consistent with other solvers
    node_list = [];         // List of explored nodes for visualization
    node_list_index = 0;    // Index for animation
    path_list = [];         // List of nodes in the final path
    path_list_index = 0;    // Index for path animation
    found = false;          // Flag to indicate if target is reached
    path = false;           // Flag to switch between exploration and path tracing

    // Stack for DFS exploration (LIFO structure)
    let stack = [[start_pos, null]]; // Each entry is [position, parent]
    grid[start_pos[0]][start_pos[1]] = 1; // Mark start as visited (1 indicates direction placeholder)

    // Exploration phase
    while (stack.length > 0 && !found) {
        let [current_cell, parent] = stack.pop(); // Pop the top of the stack
        let list = get_neighbours(current_cell, 1); // Get adjacent cells

        // Explore neighbors
        for (let i = 0; i < list.length; i++) {
            let neighbor = list[i];
            if (get_node(neighbor[0], neighbor[1]) == 0) { // Unvisited cell
                stack.push([neighbor, current_cell]); // Push neighbor with parent reference
                grid[neighbor[0]][neighbor[1]] = i + 1; // Mark direction (1: right, 2: up, 3: left, 4: down)

                if (neighbor[0] == target_pos[0] && neighbor[1] == target_pos[1]) {
                    found = true; // Target found, stop exploration
                    break;
                }

                node_list.push(neighbor); // Add to visualization list
            }
        }
    }

    // Path reconstruction phase (if target found)
    if (found) {
        let current_node = target_pos;

        // Backtrack from target to start using direction markers
        while (current_node[0] != start_pos[0] || current_node[1] != start_pos[1]) {
            path_list.push(current_node);

            // Move to parent based on direction stored in grid
            switch (grid[current_node[0]][current_node[1]]) {
                case 1: current_node = [current_node[0], current_node[1] + 1]; break; // Right
                case 2: current_node = [current_node[0] - 1, current_node[1]]; break; // Up
                case 3: current_node = [current_node[0], current_node[1] - 1]; break; // Left
                case 4: current_node = [current_node[0] + 1, current_node[1]]; break; // Down
                default: break;
            }
        }

        path_list.pop(); // Remove start_pos from path (optional, matches other solvers)
        path_list.reverse(); // Reverse to go from start to target
    }

    // Start the animation using the existing interval function
    maze_solvers_interval();
}


function dijkstra() {
    node_list = [];
    node_list_index = 0;
    path_list = [];
    path_list_index = 0;
    found = false;
    path = false;

    // Initialize cost grid and direction grid
    let cost_grid = new Array(grid.length).fill(Infinity).map(() => new Array(grid[0].length).fill(Infinity));
    grid[start_pos[0]][start_pos[1]] = 1; // Mark start (direction placeholder)
    cost_grid[start_pos[0]][start_pos[1]] = 0; // Start has cost 0

    // Frontier with [cost, [x, y]] pairs for sorting
    let frontier = [[0, start_pos]];
    
    while (frontier.length > 0 && !found) {
        // Sort frontier by cost (lowest first)
        frontier.sort((a, b) => a[0] - b[0]);
        let [current_cost, current_cell] = frontier.shift(); // Dequeue lowest cost

        // If we've reached the target, stop
        if (current_cell[0] === target_pos[0] && current_cell[1] === target_pos[1]) {
            found = true;
            break;
        }

        let list = get_neighbours(current_cell, 1);
        for (let i = 0; i < list.length; i++) {
            let neighbor = list[i];
            if (get_node(neighbor[0], neighbor[1]) === 0) { // Unvisited cell
                let new_cost = current_cost + 1; // Uniform cost of 1 per step

                if (new_cost < cost_grid[neighbor[0]][neighbor[1]]) {
                    cost_grid[neighbor[0]][neighbor[1]] = new_cost;
                    grid[neighbor[0]][neighbor[1]] = i + 1; // Store direction to parent
                    frontier.push([new_cost, neighbor]);
                    node_list.push(neighbor); // Add to visualization
                }
            }
        }
    }

    // Reconstruct path if target found
    if (found) {
        let current_node = target_pos;
        while (current_node[0] != start_pos[0] || current_node[1] != start_pos[1]) {
            path_list.push(current_node);
            switch (grid[current_node[0]][current_node[1]]) {
                case 1: current_node = [current_node[0], current_node[1] + 1]; break; // Right
                case 2: current_node = [current_node[0] - 1, current_node[1]]; break; // Up
                case 3: current_node = [current_node[0], current_node[1] - 1]; break; // Left
                case 4: current_node = [current_node[0] + 1, current_node[1]]; break; // Down
                default: break;
            }
        }
        path_list.pop(); // Remove start_pos (optional, matches other solvers)
        path_list.reverse();
    }

    maze_solvers_interval();
}

function a_star() {
    node_list = [];
    node_list_index = 0;
    path_list = [];
    path_list_index = 0;
    found = false;
    path = false;
    let frontier = [start_pos];
    let cost_grid = new Array(grid.length).fill(0).map(() => new Array(grid[0].length).fill(0));
    grid[start_pos[0]][start_pos[1]] = 1;

    do {
        frontier.sort(function(a, b) {
            let a_value = cost_grid[a[0]][a[1]] + distance(a, target_pos) * Math.sqrt(2);
            let b_value = cost_grid[b[0]][b[1]] + distance(b, target_pos) * Math.sqrt(2);
            return a_value - b_value;
        });

        let current_cell = frontier[0];
        let list = get_neighbours(current_cell, 1);
        frontier.splice(0, 1);

        for (let i = 0; i < list.length; i++)
            if (get_node(list[i][0], list[i][1]) == 0) {
                frontier.push(list[i]);
                grid[list[i][0]][list[i][1]] = i + 1;
                cost_grid[list[i][0]][list[i][1]] = cost_grid[current_cell[0]][current_cell[1]] + 1;

                if (list[i][0] == target_pos[0] && list[i][1] == target_pos[1]) {
                    found = true;
                    break;
                }

                node_list.push(list[i]);
            }
    } while (frontier.length > 0 && !found);

    if (found) {
        let current_node = target_pos;

        while (current_node[0] != start_pos[0] || current_node[1] != start_pos[1]) {
            switch (grid[current_node[0]][current_node[1]]) {
                case 1: current_node = [current_node[0], current_node[1] + 1]; break;
                case 2: current_node = [current_node[0] - 1, current_node[1]]; break;
                case 3: current_node = [current_node[0], current_node[1] - 1]; break;
                case 4: current_node = [current_node[0] + 1, current_node[1]]; break;
                default: break;
            }

            path_list.push(current_node);
        }

        path_list.pop();
        path_list.reverse();
    }

    maze_solvers_interval();
}

function maze_solvers() {
    clear_grid();
    grid_clean = false;

    if ((Math.abs(start_pos[0] - target_pos[0]) == 0 && Math.abs(start_pos[1] - target_pos[1]) == 1) ||
        (Math.abs(start_pos[0] - target_pos[0]) == 1 && Math.abs(start_pos[1] - target_pos[1]) == 0)) {
        place_to_cell(start_pos[0], start_pos[1]).classList.add("cell_path");
        place_to_cell(target_pos[0], target_pos[1]).classList.add("cell_path");
        onMazeSolved(); // Call this immediately for trivial case
    } else if (document.querySelector("#slct_1").value == "1") {
        breadth_first();
    } else if (document.querySelector("#slct_1").value == "2") {
        depth_first();
    } else if (document.querySelector("#slct_1").value == "4") {
        dijkstra();
    } else if (document.querySelector("#slct_1").value == "5") {
        a_star();
    }
}