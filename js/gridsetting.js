let initial_max_grid_size = 9;
document.addEventListener("DOMContentLoaded", () => {

function updateMaxGridSize() {
    const mazeSizeDropdown = document.getElementById("slct_3"); 
    const selectedValue = parseInt(mazeSizeDropdown.value, 10); 

    switch (selectedValue) {
        case 1: // 9 x 9
            initial_max_grid_size = 9;
            break;
        case 2: // 16 x 16
            initial_max_grid_size = 17;
            break;
        case 3: // 21 x 21
            initial_max_grid_size = 21;
            break;
    }

    console.log(`Updated initial_max_grid_size: ${initial_max_grid_size}`);
    maze_generators();
}

document.getElementById("slct_3").addEventListener("change", updateMaxGridSize);

});