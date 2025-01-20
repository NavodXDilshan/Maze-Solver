let initial_max_grid_size = 11;
document.addEventListener("DOMContentLoaded", () => {

// Function to update initial_max_grid_size based on the selected maze size
function updateMaxGridSize() {
    const mazeSizeDropdown = document.getElementById("slct_3"); // Maze Size dropdown
    const selectedValue = parseInt(mazeSizeDropdown.value, 10); // Get the selected value and convert it to an integer

    switch (selectedValue) {
        case 1: // 3 x 3
            initial_max_grid_size = 3;
            break;
        case 2: // 9 x 9
            initial_max_grid_size = 9;
            break;
        case 3: // 21 x 21
            initial_max_grid_size = 21;
            break;
        default:
            console.warn("Unexpected maze size selected");
    }

    console.log(`Updated initial_max_grid_size: ${initial_max_grid_size}`);
    maze_generators();
}

// Add an event listener to the dropdown to listen for changes
document.getElementById("slct_3").addEventListener("change", updateMaxGridSize);

});