"use strict";
let timerInterval = null; // To store the interval ID for the timer
let startTime = null; // To store the start time when "Play" is pressed

function hidden_clear()
{
	for (let i = 0; i < timeouts.length; i++)
		clearTimeout(timeouts[i]);

	timeouts = [];
	clearInterval(my_interval);
	delete_grid();

	if (window.innerWidth > menu_width + 50)
	{
		init_css_properties_before();
		generate_grid();
		init_css_properties_after();
		visualizer_event_listeners();
	}
	resetTimer();
}

function hidden_clear_vision()
{
	for (let i = 0; i < timeouts.length; i++)
		clearTimeout(timeouts[i]);

	timeouts = [];
	clearInterval(my_interval);
	delete_grid();

	if (window.innerWidth > menu_width + 50)
	{
		init_css_properties_before();
		generate_grid_vision();
		init_css_properties_after();
		visualizer_event_listeners();
	}
	resetTimer();
}

function clear()
{
	document.querySelector("#slct_2").value = "0";
	hidden_clear();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval); // Clear any existing timer
    startTime = Date.now(); // Record start time
    timerInterval = setInterval(updateTimer, 10); // Update every 10ms for precision
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        updateTimer(); // Final update to show exact time
    }
}

function resetTimer() {
    stopTimer();
    startTime = null;
    document.querySelector("#timer_value").textContent = "0.00s";
}

function updateTimer() {
    if (startTime === null) return;
    const elapsed = (Date.now() - startTime) / 1000; // Convert to seconds
    document.querySelector("#timer_value").textContent = elapsed.toFixed(2) + "s";
}

function menu_event_listeners()
{
	
	document.querySelector("#slct_2").addEventListener('change', event =>
	{
		maze_generators();
	});

	document.querySelector("#clear").addEventListener('click', event =>
	{
		let start_temp = start_pos;
		let target_temp = target_pos;
		clear();
		place_to_cell(start_pos[0], start_pos[1]).classList.remove("start");
		place_to_cell(start_temp[0], start_temp[1]).classList.add("start");
		place_to_cell(target_pos[0], target_pos[1]).classList.remove("target");
		place_to_cell(target_temp[0], target_temp[1]).classList.add("target");
		start_pos = start_temp;
		target_pos = target_temp;
	});

	document.querySelector("#play").addEventListener('click', event =>
	{
		if (generating)
			document.querySelector("#slct_2").value = "0";

		generating = false;
		clear_grid();
		startTimer(); // Start the timer when "Play" is pressed
        maze_solvers(); // Assume this function solves the maze
	});

	
}

// Function to call when maze is solved (to be triggered from maze_solvers.js)
function onMazeSolved() {
    stopTimer(); // Stop the timer when the maze is solved
}

// Add DOMContentLoaded listener if not already present elsewhere
document.addEventListener("DOMContentLoaded", function () {
    menu_event_listeners();
});
