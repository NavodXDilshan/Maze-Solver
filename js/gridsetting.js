let initial_max_grid_size = 9;
document.addEventListener("DOMContentLoaded", () => {

function updateMaxGridSize() {
    const mazeSizeDropdown = document.getElementById("slct_3"); // Maze Size dropdown
    const selectedValue = parseInt(mazeSizeDropdown.value, 10); // Get the selected value and convert it to an integer

    switch (selectedValue) {
        case 1: // 9 x 9
            initial_max_grid_size = 9;
            break;
        case 2: // 16 x 16
            initial_max_grid_size = 16;
            break;
        case 3: // 21 x 21
            initial_max_grid_size = 21;
            break;
    }

    console.log(`Updated initial_max_grid_size: ${initial_max_grid_size}`);
    // fetchMazeData()
    maze_generators();
}

document.getElementById("slct_3").addEventListener("change", updateMaxGridSize);

});