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

const cellSize = 30; // Must match the cellSize in canvas_recursive_backtracking

function maze_solvers_interval() {
    my_interval = window.setInterval(function() {
        const isCanvasMode = mazeCanvas && mazeCtx;
        const cellWidth = isCanvasMode ? mazeCanvas.width / grid_size_x : 30;
        const cellHeight = isCanvasMode ? mazeCanvas.height / grid_size_y : 30;

        if (!path) {
            const currentNode = node_list[node_list_index];
            if (isCanvasMode) {
                mazeCtx.fillStyle = "blue";
                mazeCtx.fillRect(
                    currentNode[0] * cellWidth + 2,
                    currentNode[1] * cellHeight + 2,
                    cellWidth - 4,
                    cellHeight - 4
                );
            } else {
                place_to_cell(currentNode[0], currentNode[1]).classList.add("cell_algo");
            }
            node_list_index++;

            if (node_list_index == node_list.length) {
                if (!found) {
                    clearInterval(my_interval);
                } else {
                    path = true;
                    if (isCanvasMode) {
                        mazeCtx.fillStyle = "green";
                        mazeCtx.beginPath();
                        mazeCtx.arc(
                            (start_pos[0] + 0.5) * cellWidth,
                            (start_pos[1] + 0.5) * cellHeight,
                            cellWidth / 4,
                            0,
                            Math.PI * 2
                        );
                        mazeCtx.fill();
                    } else {
                        place_to_cell(start_pos[0], start_pos[1]).classList.add("cell_path");
                    }
                }
            }
        } else {
            if (path_list_index == path_list.length) {
                if (isCanvasMode) {
                    mazeCtx.fillStyle = "red";
                    mazeCtx.beginPath();
                    mazeCtx.arc(
                        (target_pos[0] + 0.5) * cellWidth,
                        (target_pos[1] + 0.5) * cellHeight,
                        cellWidth / 4,
                        0,
                        Math.PI * 2
                    );
                    mazeCtx.fill();
                } else {
                    place_to_cell(target_pos[0], target_pos[1]).classList.add("cell_path");
                }
                clearInterval(my_interval);
                onMazeSolved();
                return;
            }

            const pathNode = path_list[path_list_index];
            if (isCanvasMode) {
                mazeCtx.fillStyle = "red";
                mazeCtx.fillRect(
                    pathNode[0] * cellWidth + 2,
                    pathNode[1] * cellHeight + 2,
                    cellWidth - 4,
                    cellHeight - 4
                );
            } else {
                place_to_cell(pathNode[0], pathNode[1]).classList.remove("cell_algo");
                place_to_cell(pathNode[0], pathNode[1]).classList.add("cell_path");
            }
            path_list_index++;
        }
    }, 50);
}

function breadth_first() {
    node_list = [];
    node_list_index = 0;
    path_list = [];
    path_list_index = 0;
    found = false;
    path = false;
    let frontier = [start_pos];
    console.log("Starting Breadth-First Search from:", start_pos);
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
    node_list = [];
    node_list_index = 0;
    path_list = [];
    path_list_index = 0;
    found = false;
    path = false;

    let stack = [[start_pos, null]];
    grid[start_pos[0]][start_pos[1]] = 1;

    while (stack.length > 0 && !found) {
        let [current_cell, parent] = stack.pop();
        let list = get_neighbours(current_cell, 1);

        for (let i = 0; i < list.length; i++) {
            let neighbor = list[i];
            if (get_node(neighbor[0], neighbor[1]) == 0) {
                stack.push([neighbor, current_cell]);
                grid[neighbor[0]][neighbor[1]] = i + 1;

                if (neighbor[0] == target_pos[0] && neighbor[1] == target_pos[1]) {
                    found = true;
                    break;
                }

                node_list.push(neighbor);
            }
        }
    }

    if (found) {
        let current_node = target_pos;

        while (current_node[0] != start_pos[0] || current_node[1] != start_pos[1]) {
            path_list.push(current_node);

            switch (grid[current_node[0]][current_node[1]]) {
                case 1: current_node = [current_node[0], current_node[1] + 1]; break;
                case 2: current_node = [current_node[0] - 1, current_node[1]]; break;
                case 3: current_node = [current_node[0], current_node[1] - 1]; break;
                case 4: current_node = [current_node[0] + 1, current_node[1]]; break;
                default: break;
            }
        }

        path_list.pop();
        path_list.reverse();
    }

    maze_solvers_interval();
}

function dijkstra() {
    node_list = [];
    node_list_index = 0;
    path_list = [];
    path_list_index = 0;
    found = false;
    path = false;

    let cost_grid = new Array(grid.length).fill(Infinity).map(() => new Array(grid[0].length).fill(Infinity));
    grid[start_pos[0]][start_pos[1]] = 1;
    cost_grid[start_pos[0]][start_pos[1]] = 0;

    let frontier = [[0, start_pos]];

    while (frontier.length > 0 && !found) {
        frontier.sort((a, b) => a[0] - b[0]);
        let [current_cost, current_cell] = frontier.shift();

        if (current_cell[0] === target_pos[0] && current_cell[1] === target_pos[1]) {
            found = true;
            break;
        }

        let list = get_neighbours(current_cell, 1);
        for (let i = 0; i < list.length; i++) {
            let neighbor = list[i];
            if (get_node(neighbor[0], neighbor[1]) === 0) {
                let new_cost = current_cost + 1;
                if (new_cost < cost_grid[neighbor[0]][neighbor[1]]) {
                    cost_grid[neighbor[0]][neighbor[1]] = new_cost;
                    grid[neighbor[0]][neighbor[1]] = i + 1;
                    frontier.push([new_cost, neighbor]);
                    node_list.push(neighbor);
                }
            }
        }
    }

    if (found) {
        let current_node = target_pos;
        path_list = [];
        while (current_node[0] !== start_pos[0] || current_node[1] !== start_pos[1]) {
            path_list.push([...current_node]);
            switch (grid[current_node[0]][current_node[1]]) {
                case 1: current_node = [current_node[0], current_node[1] + 1]; break;
                case 2: current_node = [current_node[0] - 1, current_node[1]]; break;
                case 3: current_node = [current_node[0], current_node[1] - 1]; break;
                case 4: current_node = [current_node[0] + 1, current_node[1]]; break;
                default: break;
            }
        }
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
    console.log("Starting maze_solvers()");
    clear_grid(); // This now preserves walls
    grid_clean = false;

    const isCanvasMode = mazeCanvas && mazeCtx;
    console.log("Is canvas mode:", isCanvasMode);

    if ((Math.abs(start_pos[0] - target_pos[0]) == 0 && Math.abs(start_pos[1] - target_pos[1]) == 1) ||
        (Math.abs(start_pos[0] - target_pos[0]) == 1 && Math.abs(start_pos[1] - target_pos[1]) == 0)) {
        console.log("Start and target are adjacent, drawing direct path");
        if (isCanvasMode) {
            mazeCtx.fillStyle = "red";
            mazeCtx.fillRect(start_pos[0] * cellSize + 2, start_pos[1] * cellSize + 2, cellSize - 4, cellSize - 4);
            mazeCtx.fillRect(target_pos[0] * cellSize + 2, target_pos[1] * cellSize + 2, cellSize - 4, cellSize - 4);
            mazeCtx.fillStyle = "green";
            mazeCtx.beginPath();
            mazeCtx.arc((start_pos[0] + 0.5) * cellSize, (start_pos[1] + 0.5) * cellSize, cellSize / 4, 0, Math.PI * 2);
            mazeCtx.fill();
            mazeCtx.fillStyle = "red";
            mazeCtx.beginPath();
            mazeCtx.arc((target_pos[0] + 0.5) * cellSize, (target_pos[1] + 0.5) * cellSize, cellSize / 4, 0, Math.PI * 2);
            mazeCtx.fill();
        } else {
            place_to_cell(start_pos[0], start_pos[1]).classList.add("cell_path");
            place_to_cell(target_pos[0], target_pos[1]).classList.add("cell_path");
        }
        onMazeSolved();
    } else if (document.querySelector("#slct_1").value == "1") {
        console.log("Running Breadth-First Search");
        breadth_first();
    } else if (document.querySelector("#slct_1").value == "2") {
        console.log("Running Depth-First Search");
        depth_first();
    } else if (document.querySelector("#slct_1").value == "4") {
        console.log("Running Dijkstra");
        dijkstra();
    } else if (document.querySelector("#slct_1").value == "5") {
        console.log("Running A*");
        a_star();
    } else {
        console.log("No solving algorithm selected or invalid value:", document.querySelector("#slct_1").value);
    }
}