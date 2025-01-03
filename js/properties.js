"use strict";

let initial_max_grid_size = 9; // Default value
const menu_width = 323;

let cell_size;
let grid_size_x;
let grid_size_y;
let grid;
let clicking = false;
let moving_start = false;
let moving_target = false;
let start_pos;
let target_pos;
let grid_clean = true;
let my_interval;

let node_list;
let node_list_index;
let path_list;
let path_list_index;
let found = false;
let path = false;

let generating = false;
let timeouts = [];

// Function to set initial_max_grid_size based on Maze Size selection
function set_initial_max_grid_size() {
    const mazeSizeChoice = document.getElementById("slct_3").value;

    // Debugging: Check if the correct value is retrieved
    console.log(`Selected Maze Size Value: ${mazeSizeChoice}`);

    switch (mazeSizeChoice) {
        case "1":
            initial_max_grid_size = 3; // 3 x 3
            break;
        case "2":
            initial_max_grid_size = 9; // 9 x 9
            break;
        case "3":
            initial_max_grid_size = 21; // 21 x 21
            break;
        default:
            initial_max_grid_size = 9; // Default size
    }

    // Debugging: Confirm the variable is updated
    console.log(`Initial max grid size updated to: ${initial_max_grid_size}`);
}

// Add event listener for Maze Size dropdown
const mazeSizeDropdown = document.getElementById("slct_3");

if (mazeSizeDropdown) {
    mazeSizeDropdown.addEventListener("change", set_initial_max_grid_size);
    // Optional: Initialize on page load
    set_initial_max_grid_size();
} else {
    console.error("Maze Size dropdown (#slct_3) not found.");
}
