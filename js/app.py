from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import json
import tempfile
import os

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

import cv2
import numpy as np

def process_maze_image(image_path):
    # Read the image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold to create binary image (walls vs paths)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    
    # Get image dimensions
    height, width = binary.shape
    
    # IMPROVED GRID DETECTION
    # Detect transitions in middle row/column
    mid_y = height // 2
    mid_x = width // 2
    
    horizontal_scan = binary[mid_y, :]
    vertical_scan = binary[:, mid_x]
    
    h_transitions = np.where(np.diff(horizontal_scan) != 0)[0]
    v_transitions = np.where(np.diff(vertical_scan) != 0)[0]
    
    cell_size = None
    # Try to calculate cell size from transitions
    if len(h_transitions) > 1 and len(v_transitions) > 1:
        h_diffs = np.diff(h_transitions)
        v_diffs = np.diff(v_transitions)
        cell_width = np.median(h_diffs)
        cell_height = np.median(v_diffs)
        
        if 0.8 < cell_width / cell_height < 1.2:
            cell_size = int((cell_width + cell_height) / 2)
        else:
            cell_size = int(min(cell_width, cell_height))
    
    # If cell_size couldn't be determined from transitions
    if cell_size is None:
        possible_sizes = [9, 16, 21]
        best_error = float('inf')
        best_size = 21  # Default fallback
        
        for size in possible_sizes:
            cs_w = width // size
            cs_h = height // size
            error = abs(width - cs_w * size) + abs(height - cs_h * size)
            if error < best_error:
                best_error = error
                best_size = size
        
        cell_size = min(width, height) // best_size
        cols_raw = width // cell_size
        rows_raw = height // cell_size
        grid_size = best_size
    else:
        # Calculate grid size candidates
        cols_raw = width // cell_size
        rows_raw = height // cell_size
        grid_size_candidate = min(cols_raw, rows_raw)
        
        # Find closest standard size
        possible_sizes = [9, 16, 21]
        grid_size = min(possible_sizes, key=lambda x: abs(x - grid_size_candidate))
    
    # Ensure we don't get invalid grid sizes
    grid_size = max(9, min(grid_size, 21))
    
    # Create grid
    maze = np.zeros((grid_size, grid_size), dtype=int)
    
    # Sample each cell's center
    for i in range(grid_size):
        for j in range(grid_size):
            center_y = int((i + 0.5) * (height / grid_size))
            center_x = int((j + 0.5) * (width / grid_size))
            if 0 <= center_y < height and 0 <= center_x < width:
                maze[i, j] = 0 if binary[center_y, center_x] < 127 else 1
    
    # Color detection (unchanged)
    # ... [rest of the original color detection code] ...
    # Find start point (green marker)
    start_point = None
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Green color range
    lower_green = np.array([40, 40, 40])
    upper_green = np.array([80, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    green_pixels = np.where(green_mask > 0)
    
    if len(green_pixels[0]) > 0:
        # Find the average position of green pixels
        avg_y = int(np.mean(green_pixels[0]))
        avg_x = int(np.mean(green_pixels[1]))
        
        # Map to grid coordinates
        start_i = avg_y // cell_size
        start_j = avg_x // cell_size
        
        # Validate grid position
        if 0 <= start_i < grid_size and 0 <= start_j < grid_size:
            start_point = [start_i, start_j]
    
    # Find end point (red marker)
    end_point = None
    # Red color range in HSV
    lower_red1 = np.array([0, 100, 100])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 100, 100])
    upper_red2 = np.array([180, 255, 255])
    
    red_mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    red_mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(red_mask1, red_mask2)
    
    red_pixels = np.where(red_mask > 0)
    
    if len(red_pixels[0]) > 0:
        # Find the average position of red pixels
        avg_y = int(np.mean(red_pixels[0]))
        avg_x = int(np.mean(red_pixels[1]))
        
        # Map to grid coordinates
        end_i = avg_y // cell_size
        end_j = avg_x // cell_size
        
        # Validate grid position
        if 0 <= end_i < grid_size and 0 <= end_j < grid_size:
            end_point = [end_i, end_j]
    
    # Convert grid to list of strings as required
    grid_strings = []
    for row in maze:
        grid_strings.append(''.join(map(str, row)))

    # Convert grid to strings
    grid_strings = [''.join(map(str, row)) for row in maze]

    # Create JSON structure
    maze_json = {
        "width": grid_size,
        "height": grid_size,
        "grid": grid_strings
    }

    # Add start/end points if detected
    # ... [rest of the original start/end detection code] ...
    if start_point:
        maze_json["start"] = start_point
    
    if end_point:
        maze_json["end"] = end_point
    

    return maze_json

def process_maze_image(image_path):
    # Read the image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold to create binary image (walls vs paths)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    
    # Get image dimensions
    height, width = binary.shape
    
    # IMPROVED GRID DETECTION
    # Count the number of grid cells based on the image
    # For this specific type of maze with clear grid lines
    
    # First, detect all white pixels (paths)
    white_pixels = np.where(binary == 255)
    
    # Find unique x and y coordinates with white pixels
    y_coords = white_pixels[0]
    x_coords = white_pixels[1]
    
    # Count actual cells by analyzing the image directly
    # We'll use the fact that the maze has clear grid cells
    
    # Sample pixels across the image to detect the grid pattern
    # This is more robust than the previous approach
    
    # For this maze image, we can directly count grid cells
    # by detecting transitions between wall and path
    
    # APPROACH: Scan horizontal and vertical lines to detect transitions
    # For square mazes specifically (21x21)
    
    # First, let's scan the middle rows and columns to get the cell size
    mid_y = height // 2
    mid_x = width // 2
    
    horizontal_scan = binary[mid_y, :]
    vertical_scan = binary[:, mid_x]
    
    # Detect transitions from wall to path
    h_transitions = np.where(np.diff(horizontal_scan) != 0)[0]
    v_transitions = np.where(np.diff(vertical_scan) != 0)[0]
    
    # If transitions are found, estimate cell size
    if len(h_transitions) > 1 and len(v_transitions) > 1:
        # Average distance between transitions
        h_diffs = np.diff(h_transitions)
        v_diffs = np.diff(v_transitions)
        
        # Estimate cell width and height
        cell_width = np.median(h_diffs)
        cell_height = np.median(v_diffs)
        
        # Cell size should be consistent in a proper grid
        if 0.8 < cell_width / cell_height < 1.2:  # Close to square
            cell_size = int((cell_width + cell_height) / 2)
        else:
            # If not square, use individual estimates
            cell_size = int(min(cell_width, cell_height))
    else:
        # Fallback: estimate based on image size (assuming grid is 21x21)
        # This is a better approach for this particular maze
        cell_size = min(width, height) // 21
    
    # Calculate grid dimensions
    # First calculate raw dimensions
    cols_raw = width // cell_size
    rows_raw = height // cell_size
    
    # For square mazes, ensure equal dimensions by taking the minimum
    # This prevents detecting an extra column or row
    grid_size = min(cols_raw, rows_raw)
    
    # Make sure we get exactly a square grid (e.g., 21x21)
    rows = grid_size
    cols = grid_size
    
    # Create a new grid with the correct dimensions
    maze = np.zeros((rows, cols), dtype=int)
    
    # Sample each cell's center to determine if it's a wall or path
    for i in range(rows):
        for j in range(cols):
            # Calculate center coordinates, ensuring we stay within the detected grid
            # Use the center of the cell for more accurate sampling
            center_y = int((i + 0.5) * cell_size)
            center_x = int((j + 0.5) * cell_size)
            
            # Check if center coordinates are within bounds
            if 0 <= center_y < height and 0 <= center_x < width:
                if binary[center_y, center_x] < 127:  # Path is white
                    maze[i, j] = 1
    
    # Find start point (green marker)
    start_point = None
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Green color range
    lower_green = np.array([40, 40, 40])
    upper_green = np.array([80, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    green_pixels = np.where(green_mask > 0)
    
    if len(green_pixels[0]) > 0:
        # Find the average position of green pixels
        avg_y = int(np.mean(green_pixels[0]))
        avg_x = int(np.mean(green_pixels[1]))
        
        # Map to grid coordinates
        start_i = avg_y // cell_size
        start_j = avg_x // cell_size
        
        # Validate grid position
        if 0 <= start_i < rows and 0 <= start_j < cols:
            start_point = [start_i, start_j]
    
    # Find end point (red marker)
    end_point = None
    # Red color range in HSV
    lower_red1 = np.array([0, 100, 100])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 100, 100])
    upper_red2 = np.array([180, 255, 255])
    
    red_mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    red_mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(red_mask1, red_mask2)
    
    red_pixels = np.where(red_mask > 0)
    
    if len(red_pixels[0]) > 0:
        # Find the average position of red pixels
        avg_y = int(np.mean(red_pixels[0]))
        avg_x = int(np.mean(red_pixels[1]))
        
        # Map to grid coordinates
        end_i = avg_y // cell_size
        end_j = avg_x // cell_size
        
        # Validate grid position
        if 0 <= end_i < rows and 0 <= end_j < cols:
            end_point = [end_i, end_j]
    
    # Convert grid to list of strings as required
    grid_strings = []
    for row in maze:
        grid_strings.append(''.join(map(str, row)))
    
    # Create the JSON structure in the required format
    maze_json = {
        "width": cols,
        "height": rows,
        "grid": grid_strings
    }
    
    if start_point:
        maze_json["start"] = start_point
    
    if end_point:
        maze_json["end"] = end_point
    
    return maze_json

@app.route('/upload', methods=['POST'])
def process_maze():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Save the uploaded file to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        # Process the maze image
        maze_json = process_maze_image(temp_file_path)

        # Write to mazeData.json
        with open('../mazeData.json', 'w') as f:
            json.dump(maze_json, f, indent=4)
        
        # Clean up the temporary file
        os.unlink(temp_file_path)
        
        return jsonify(maze_json)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)