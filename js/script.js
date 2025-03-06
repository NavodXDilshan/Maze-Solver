"use strict";

function init_css_properties_before()
{
	document.querySelector("#menu").style.width = menu_width.toString(10) + "px";
	document.querySelector("#visualizer").style.width = (window.innerWidth - menu_width).toString(10) + "px";
	document.querySelector("#visualizer").style.left = menu_width.toString(10) + "px";
}

function init_css_properties_after()
{
	document.querySelector("#grid").style.width = (cell_size * grid_size_x).toString(10) + "px";
	document.querySelector("#grid").style.height = (cell_size * grid_size_y).toString(10) + "px";
}

window.onload = function()
{
	init_css_properties_before();
	generate_grid();
	init_css_properties_after();

	window.addEventListener('resize', () =>
	{
		clear();
	});

	visualizer_event_listeners();
	menu_event_listeners();

	document.querySelector("#hider").style.visibility= "hidden";
}

document.getElementById('upload_button').addEventListener('click', function() {
    const fileInput = document.getElementById('maze_image');
    const file = fileInput.files[0];
    
    if (file) {
        const formData = new FormData();
        formData.append('image', file);

        // Send the image to the Flask backend
        fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Server response:', data);
            // Update the maze generation algorithm dropdown
            document.getElementById('slct_2').value = "7";
            // Optionally, update the visualizer with the processed maze
        })
        .catch(error => {
            console.error('Error:', error);
        });
    } else {
        alert('Please select an image file first!');
    }
});
