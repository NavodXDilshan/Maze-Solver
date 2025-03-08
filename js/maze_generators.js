"use strict";

function get_neighbours(cell, distance)
{
	let up = [cell[0], cell[1] - distance];
	let right = [cell[0] + distance, cell[1]];
	let down = [cell[0], cell[1] + distance];
	let left = [cell[0] - distance, cell[1]];
	return [up, right, down, left];
}

function random_int(min, max)
{
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

function fill()
{
	for (let i = 0; i < grid.length; i++)
		for (let j = 0; j < grid[0].length; j++)
			add_wall(i, j);
}

function fill_walls()
{
	for (let i = 0; i < grid.length; i++)
		for (let j = 0; j < grid[0].length; j++)
			if (i % 2 == 0 || j % 2 == 0)
				add_wall(i, j);
}

function enclose()
{
	for (let i = 0; i < grid.length; i++)
	{
		add_wall(i, 0);
		add_wall(i, grid[0].length - 1);
	}

	for (let j = 0; j < grid[0].length; j++)
	{
		add_wall(0, j);
		add_wall(grid.length - 1, j);
	}
}

function randomized_depth_first()
{
	fill();
	let current_cell = [1, 1];
	remove_wall(current_cell[0], current_cell[1]);
	grid[current_cell[0]][current_cell[1]] = 1;
	let stack = [current_cell];

	my_interval = window.setInterval(function()
	{
		if (stack.length == 0)
		{
			clearInterval(my_interval);
			clear_grid();
			generating = false;
			return;
		}

		current_cell = stack.pop();
		let neighbours = [];
		let list = get_neighbours(current_cell, 2);

		for (let i = 0; i < list.length; i++)
			if (get_node(list[i][0], list[i][1]) == -1 || get_node(list[i][0], list[i][1]) == 0)
				neighbours.push(list[i]);

		if (neighbours.length > 0)
		{
			stack.push(current_cell);
			let chosen_cell = neighbours[random_int(0, neighbours.length)];
			remove_wall((current_cell[0] + chosen_cell[0]) / 2, (current_cell[1] + chosen_cell[1]) / 2);
			remove_wall(chosen_cell[0], chosen_cell[1]);
			grid[chosen_cell[0]][chosen_cell[1]] = 1;
			stack.push(chosen_cell);
		}

		else
		{
			remove_wall(current_cell[0], current_cell[1]);
			grid[current_cell[0]][current_cell[1]] = 2;
			place_to_cell(current_cell[0], current_cell[1]).classList.add("visited_cell");

			for (let i = 0; i < list.length; i++)
			{
				let wall = [(current_cell[0] + list[i][0]) / 2, (current_cell[1] + list[i][1]) / 2]

				if (get_node(list[i][0], list[i][1]) == 2 && get_node(wall[0], wall[1]) > -1)
					place_to_cell(wall[0], wall[1]).classList.add("visited_cell");
			}
		}
	}, 16);
}

function kruskal_algorithm()
{
	fill_walls();
	let nb_areas = 0;
	let wall_list = [];

	for (let i = 1; i < grid.length - 1; i++)
		for (let j = 1; j < grid[0].length - 1; j++)
		{
			if (i % 2 == 1 && j % 2 == 1)
			{
				nb_areas++;
				grid[i][j] = nb_areas;
				place_to_cell(i, j).classList.add("visited_cell");
			}

			if ((i + j) % 2 == 1)
				wall_list.push([i, j]);
		}

	my_interval = window.setInterval(function()
	{
		while (true)
		{
			if (nb_areas == 1)
			{
				clearInterval(my_interval);
				clear_grid();
				generating = false;
				return;
			}

			let index = random_int(0, wall_list.length);
			let wall = wall_list[index];
			wall_list.splice(index, 1);
			let cell_pair;

			if (grid[wall[0] - 1][wall[1]] > -1)
				cell_pair = [grid[wall[0] - 1][wall[1]], grid[wall[0] + 1][wall[1]]];
			else
				cell_pair = [grid[wall[0]][wall[1] - 1], grid[wall[0]][wall[1] + 1]];

			if (cell_pair[0] != cell_pair[1])
			{
				for (let i = 1; i < grid.length - 1; i += 2)
					for (let j = 1; j < grid[0].length - 1; j += 2)
						if (grid[i][j] == cell_pair[0])
							grid[i][j] = cell_pair[1];

				remove_wall(wall[0], wall[1]);
				place_to_cell(wall[0], wall[1]).classList.add("visited_cell");
				nb_areas--;
				return;
			}
		}
	}, 29);
}

function prim_algorithm()
{
	fill();
	let first_cell = [1, 1];
	remove_wall(first_cell[0], first_cell[1]);
	place_to_cell(first_cell[0], first_cell[1]).classList.add("visited_cell");
	grid[first_cell[0]][first_cell[1]] = 1;
	let wall_list = [];
	let list = get_neighbours(first_cell, 1);

	for (let i = 0; i < list.length; i++)
		if (list[i][0] > 0 && list[i][0] < grid.length - 1 && list[i][1] > 0 && list[i][1] < grid[0].length - 1)
			wall_list.push(list[i]);

	my_interval = window.setInterval(function()
	{
		while (true)
		{
			if (wall_list.length == 0)
			{
				clearInterval(my_interval);
				clear_grid();
				generating = false;
				return;
			}

			let index = random_int(0, wall_list.length);
			let wall = wall_list[index];
			wall_list.splice(index, 1);
			let cell_pair;

			if (wall[0] % 2 == 0)
				cell_pair = [[wall[0] - 1, wall[1]], [wall[0] + 1, wall[1]]];
			else
				cell_pair = [[wall[0], wall[1] - 1], [wall[0], wall[1] + 1]];

			let new_cell;
			let valid = false;

			if (grid[cell_pair[0][0]][cell_pair[0][1]] < 1)
			{
				new_cell = cell_pair[0];
				valid = true;
			}

			else if (grid[cell_pair[1][0]][cell_pair[1][1]] < 1)
			{
				new_cell = cell_pair[1];
				valid = true;
			}

			if (valid)
			{
				remove_wall(wall[0], wall[1]);
				remove_wall(new_cell[0], new_cell[1]);
				place_to_cell(wall[0], wall[1]).classList.add("visited_cell");
				place_to_cell(new_cell[0], new_cell[1]).classList.add("visited_cell");
				grid[new_cell[0]][new_cell[1]] = 1;
				let list = get_neighbours(new_cell, 1);

				for (let i = 0; i < list.length; i++)
					if (list[i][0] > 0 && list[i][0] < grid.length - 1 && list[i][1] > 0 && list[i][1] < grid[0].length - 1)
						wall_list.push(list[i]);

				return;
			}
		}
	}, 28);
}

function recursive_division() {
    generating = true;
    let timeouts = []; // Store timeouts for animation
    let time = 0; // Time delay accumulator
    const step = 28; // Delay between steps

  
    clear_grid(); 
    enclose(); 


    function divide(x, y, width, height, orientation) {
        if (width < 3 || height < 3) return;

        let horizontal = orientation === 'horizontal';

        
        let wx = x + (horizontal ? 0 : random_int(1, width - 2));
        let wy = y + (horizontal ? random_int(1, height - 2) : 0);
        if (wx % 2 === 1) wx += 1; 
        if (wy % 2 === 1) wy += 1;

       
        let px = wx + (horizontal ? random_int(0, width - 1) : 0);
        let py = wy + (horizontal ? 0 : random_int(0, height - 1));
        if (px % 2 === 0) px = (px === 0 || px === grid.length - 1) ? px + 1 : px - 1; 
        if (py % 2 === 0) py = (py === 0 || py === grid[0].length - 1) ? py + 1 : py - 1;

       
        let dx = horizontal ? 1 : 0;
        let dy = horizontal ? 0 : 1;
        let length = horizontal ? width : height;

        for (let i = 0; i < length; i++) {
            let wallX = wx + dx * i;
            let wallY = wy + dy * i;
            if ((wallX !== px || wallY !== py) && 
                wallX >= 0 && wallX < grid.length && wallY >= 0 && wallY < grid[0].length) {
                time += step;
                timeouts.push(setTimeout(() => {
                    add_wall(wallX, wallY); // Add wall with delay
                    place_to_cell(wallX, wallY).classList.add("wall"); ck
                }, time));
            }
        }

        // Recursively divide the sub-areas
        if (horizontal) {
            divide(x, y, width, wy - y, choose_orientation(wy - y, width));
            divide(x, wy + 1, width, y + height - wy - 1, choose_orientation(y + height - wy - 1, width));
        } else {
            divide(x, y, wx - x, height, choose_orientation(height, wx - x));
            divide(wx + 1, y, x + width - wx - 1, height, choose_orientation(height, x + width - wx - 1));
        }
    }

  
    function choose_orientation(height, width) {
        if (height < width) return 'vertical';
        else if (width < height) return 'horizontal';
        else return random_int(0, 2) === 0 ? 'horizontal' : 'vertical';
    }

  
    divide(1, 1, grid.length - 2, grid[0].length - 2, choose_orientation(grid.length - 2, grid[0].length - 2));

 
    timeouts.push(setTimeout(() => {
        generating = false;
    
        remove_wall(start_pos[0], start_pos[1]);
        remove_wall(target_pos[0], target_pos[1]);
        place_to_cell(start_pos[0], start_pos[1]).classList.add("start");
        place_to_cell(target_pos[0], target_pos[1]).classList.add("target");

     
        ensure_connectivity();
    }, time + step));
}


function ensure_connectivity() {
 
    let visited = new Array(grid.length).fill(false).map(() => new Array(grid[0].length).fill(false));
    let queue = [start_pos];

    while (queue.length > 0) {
        let [x, y] = queue.shift();
        if (visited[x][y]) continue;
        visited[x][y] = true;

        // Check neighbors
        let neighbors = get_neighbours([x, y], 1);
        for (let [nx, ny] of neighbors) {
            if (!visited[nx][ny] && get_node(nx, ny) >= 0) { 
                queue.push([nx, ny]);
            }
        }
    }

    // If target is not visited, clear a path
    if (!visited[target_pos[0]][target_pos[1]]) {
        let clearX = Math.floor((start_pos[0] + target_pos[0]) / 2);
        let clearY = Math.floor((start_pos[1] + target_pos[1]) / 2);
        remove_wall(clearX, clearY);
        place_to_cell(clearX, clearY).classList.remove("wall");
    }
}

async function fetchMazeData() {
    try {
        const response = await fetch("/mazeData.json"); 
        const mazeData = await response.json();
        input_image(mazeData);
    } catch (error) {
        console.error("Error loading maze data:", error);
    }
}

function input_image(mazeData) {
    // Extract data from mazeData
    let grid = mazeData.grid;
    let width = mazeData.width;
    let height = mazeData.height;
    let new_start_pos = mazeData.start;  
    let new_target_pos = mazeData.end;   

    let time = 0;
    let step = 17;
    let timeouts = [];

    
    clear_grid();

  
    if (start_pos) {
        place_to_cell(start_pos[1], start_pos[0]).classList.remove("start");  
    }
    if (target_pos) {
        place_to_cell(target_pos[1], target_pos[0]).classList.remove("target");  
    }

 
    start_pos = new_start_pos ? [...new_start_pos] : start_pos;  
    target_pos = new_target_pos ? [...new_target_pos] : target_pos;


    place_to_cell(start_pos[1], start_pos[0]).classList.add("start");  
    place_to_cell(target_pos[1], target_pos[0]).classList.add("target");  

    // Function to add walls from the JSON data
    function add_walls_from_json() {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] === '1') {  
                    time += step;
                    timeouts.push(setTimeout(function () { 
                        add_wall(x, y); 
                        place_to_cell(x, y).classList.add("wall");  
                    }, time));
                }
            }
        }
    }

    // Start adding walls from the grid
    add_walls_from_json();

 
    timeouts.push(setTimeout(function () {
        remove_wall(start_pos[1], start_pos[0]);  
        remove_wall(target_pos[1], target_pos[0]);  
        place_to_cell(start_pos[1], start_pos[0]).classList.remove("wall");
        place_to_cell(target_pos[1], target_pos[0]).classList.remove("wall");
        place_to_cell(start_pos[1], start_pos[0]).classList.add("start");
        place_to_cell(target_pos[1], target_pos[0]).classList.add("target");
    }, time + step));

    // After all walls are added, mark generation as complete
    timeouts.push(setTimeout(function () {
        generating = false;
        timeouts = [];
    }, time + step * 2));

    console.log("Updated start_pos (row, col):", start_pos);
    console.log("Updated target_pos (row, col):", target_pos);
}






function maze_generators()
{
	let start_temp = start_pos;
	let target_temp = target_pos;
	hidden_clear();
	generating = true;

	if (start_temp[0] % 2 == 0)
	{
		if (start_temp[0] == grid.length - 1)
			start_temp[0] -= 1;
		else
			start_temp[0] += 1;
	}

	if (start_temp[1] % 2 == 0)
	{
		if (start_temp[1] == 0)
			start_temp[1] += 1;
		else
			start_temp[1] -= 1;
	}

	if (target_temp[0] % 2 == 0)
	{
		if (target_temp[0] == grid.length - 1)
			target_temp[0] -= 1;
		else
			target_temp[0] += 1;
	}

	if (target_temp[1] % 2 == 0)
	{
		if (target_temp[1] == 0)
			target_temp[1] += 1;
		else
			target_temp[1] -= 1;
	}

	place_to_cell(start_pos[0], start_pos[1]).classList.remove("start");
	place_to_cell(start_temp[0], start_temp[1]).classList.add("start");
	place_to_cell(target_pos[0], target_pos[1]).classList.remove("target");
	place_to_cell(target_temp[0], target_temp[1]).classList.add("target");
	start_pos = start_temp;
	target_pos = target_temp;

	grid_clean = false;

	if (document.querySelector("#slct_2").value == "1")
		randomized_depth_first();

	else if (document.querySelector("#slct_2").value == "2")
		kruskal_algorithm();

	else if (document.querySelector("#slct_2").value == "3")
		prim_algorithm();

	else if (document.querySelector("#slct_2").value == "6")
		recursive_division();

	else if (document.querySelector("#slct_2").value == "7"){
		clear_grid();
		hidden_clear_vision();
		fetchMazeData();}
}
