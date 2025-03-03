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
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Here you can process the image and convert it to a maze
                // This is a placeholder for your image processing logic
                console.log('Image loaded successfully');
                console.log('Width:', img.width, 'Height:', img.height);
                
                // You might want to:
                // 1. Convert the image to a maze grid
                // 2. Update the visualizer
                // 3. Set the maze generation algorithm to "Input From Image" (value 7)
                document.getElementById('slct_2').value = "7";
                
                // Add your image-to-maze conversion logic here
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    } else {
        alert('Please select an image file first!');
    }
});
