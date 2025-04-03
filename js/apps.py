from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import json
import tempfile
import os

app = Flask(__name__)
CORS(app)


def process_maze_image(image_path):
    # Read the image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    # Convert to RGB for consistency
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Step 1: Preprocessing and Perspective Correction
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Apply morphological operations to enhance walls
    kernel = np.ones((3, 3), np.uint8)
    morphed = cv2.morphologyEx(blurred, cv2.MORPH_CLOSE, kernel)

    # Apply adaptive thresholding to create a binary image (walls black, background white)
    binary = cv2.adaptiveThreshold(morphed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)

    # Find contours to detect the maze boundary
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("No contours found in the image. Unable to detect maze boundary.")

    # Find the largest contour (assumed to be the maze)
    largest_contour = max(contours, key=cv2.contourArea)

    # Approximate the contour to a polygon
    epsilon = 0.02 * cv2.arcLength(largest_contour, True)
    approx = cv2.approxPolyDP(largest_contour, epsilon, True)

    # Ensure we have exactly 4 corners for perspective correction
    if len(approx) != 4:
        raise ValueError("Could not detect exactly 4 corners for perspective correction.")

    # Get the 4 corners of the maze
    corners = approx.reshape(4, 2).astype(np.float32)

    # Order the corners: top-left, top-right, bottom-right, bottom-left
    corners = corners[np.argsort(corners[:, 1])]
    top_corners = corners[:2]
    top_corners = top_corners[np.argsort(top_corners[:, 0])]
    bottom_corners = corners[2:]
    bottom_corners = bottom_corners[np.argsort(bottom_corners[:, 0])]
    ordered_corners = np.array([top_corners[0], top_corners[1], bottom_corners[1], bottom_corners[0]], dtype=np.float32)

    # Define the destination points for a square top-down view
    width = int(max(np.linalg.norm(ordered_corners[0] - ordered_corners[1]),
                    np.linalg.norm(ordered_corners[2] - ordered_corners[3])))
    height = int(max(np.linalg.norm(ordered_corners[1] - ordered_corners[2]),
                     np.linalg.norm(ordered_corners[0] - ordered_corners[3])))
    dest_corners = np.array([[0, 0], [width, 0], [width, height], [0, height]], dtype=np.float32)

    # Compute the perspective transform
    transform_matrix = cv2.getPerspectiveTransform(ordered_corners, dest_corners)

    # Apply the perspective transform
    warped = cv2.warpPerspective(img_rgb, transform_matrix, (width, height))

    # Convert to numpy array for further processing
    img_array = np.array(warped)

    # Define colors for start (blue), end (red), walls (black), paths (white)
    BLUE = np.array([0, 0, 255])  # Start point
    RED = np.array([255, 0, 0])  # End point
    BLACK = np.array([0, 0, 0])  # Walls
    WHITE = np.array([255, 255, 255])  # Paths
    COLOR_TOLERANCE = 20  # Tolerance for color matching
    WALL_TOLERANCE = 5  # Tolerance for wall color matching
    WALL_THICKNESS = 5  # Number of pixels to check around the boundary
    MIN_WALL_PIXELS = 8  # Increased to reduce false positives
    THRESHOLD = 150  # Increased to ensure teal border becomes white
    BOUNDARY_OFFSET = 5  # Number of pixels to skip at the cell boundaries

    # Preprocess the warped image
    blue_mask = np.all(np.abs(img_array - BLUE) <= COLOR_TOLERANCE, axis=2)
    red_mask = np.all(np.abs(img_array - RED) <= COLOR_TOLERANCE, axis=2)
    color_mask = blue_mask | red_mask

    # Save the colored dots
    colored_dots = np.zeros_like(img_array)
    colored_dots[blue_mask] = BLUE
    colored_dots[red_mask] = RED

    # Apply binary threshold to the rest of the image
    gray_image = np.mean(img_array, axis=2).astype(np.uint8)
    binary_image = np.where(gray_image < THRESHOLD, 0, 255)
    binary_image_rgb = np.stack([binary_image, binary_image, binary_image], axis=2)

    # Restore the blue and red dots
    binary_image_rgb[color_mask] = colored_dots[color_mask]

    # Use the preprocessed image for further processing
    img_array = binary_image_rgb

    # Step 2: Automatic Detection of Grid Size
    gray_warped = cv2.cvtColor(warped, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray_warped, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=50, maxLineGap=10)
    if lines is None:
        raise ValueError("No lines detected using Hough Transform.")

    # Categorize lines as horizontal or vertical
    horizontal_lines = []
    vertical_lines = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
        if angle < 10 or angle > 170:  # Horizontal line
            horizontal_lines.append((y1 + y2) / 2)
        elif 80 < angle < 100:  # Vertical line
            vertical_lines.append((x1 + x2) / 2)

    # Simple clustering function to group coordinates
    def cluster_coordinates(coords, eps=10):
        if not coords:
            return []

        # Sort the coordinates
        coords = sorted(coords)
        clustered = []
        current_cluster = [coords[0]]

        # Group coordinates that are within 'eps' distance of each other
        for coord in coords[1:]:
            if coord - current_cluster[-1] <= eps:
                current_cluster.append(coord)
            else:
                # Compute the average of the current cluster and start a new one
                clustered.append(np.mean(current_cluster))
                current_cluster = [coord]

        # Add the last cluster
        if current_cluster:
            clustered.append(np.mean(current_cluster))

        return sorted(clustered)

    horizontal_coords = cluster_coordinates(horizontal_lines)
    vertical_coords = cluster_coordinates(vertical_lines)

    # Count the number of cells in each direction
    num_horizontal_cells = len(horizontal_coords) - 1
    num_vertical_cells = len(vertical_coords) - 1

    # Map to the closest standard grid size
    standard_sizes = [9, 16, 17, 21]  # Added 17 for the provided image
    grid_size = min(standard_sizes, key=lambda x: abs(x - max(num_horizontal_cells, num_vertical_cells)))

    print(f"Detected {num_horizontal_cells}x{num_vertical_cells} cells. Selected grid size: {grid_size}x{grid_size}")

    # Step 3: Determine cell dimensions
    height, width, _ = img_array.shape
    cell_width = width // grid_size
    cell_height = height // grid_size

    print(f"Image dimensions: {width}x{height}")
    print(f"Grid size: {grid_size}x{grid_size}, Cell size: {cell_width}x{cell_height}")

    # Step 4: Detect start (blue) and end (red) points
    blue_pixels = np.all(np.abs(img_array - BLUE) <= COLOR_TOLERANCE, axis=2)
    red_pixels = np.all(np.abs(img_array - RED) <= COLOR_TOLERANCE, axis=2)
    blue_coords = np.where(blue_pixels)
    red_coords = np.where(red_pixels)

    start = None
    end = None

    if blue_coords[0].size > 0:
        start_pixel = [int(blue_coords[0][0]), int(blue_coords[1][0])]
        start = [start_pixel[0] // cell_height, start_pixel[1] // cell_width]
        print(f"Start (blue) detected at pixel {start_pixel}, mapped to cell {start}")
    else:
        print("No blue pixels detected within tolerance.")

    if red_coords[0].size > 0:
        end_pixel = [int(red_coords[0][0]), int(red_coords[1][0])]
        end = [end_pixel[0] // cell_height, end_pixel[1] // cell_width]
        print(f"End (red) detected at pixel {end_pixel}, mapped to cell {end}")
    else:
        print("No red pixels detected within tolerance.")

    # Step 5: Initialize the maze data for thin walls
    vertical_walls = []
    horizontal_walls = []

    # Step 6: Analyze the image to detect thin walls (using the new mechanism)
    for i in range(grid_size):
        vertical_row = []
        horizontal_row = []
        for j in range(grid_size):
            # Define the region for the current cell (i,j)
            cell_x_start = j * cell_width
            cell_y_start = i * cell_height
            cell_x_end = (j + 1) * cell_width
            cell_y_end = (i + 1) * cell_height

            # Adjust the region to avoid outer boundaries
            adjusted_y_start = cell_y_start + BOUNDARY_OFFSET if i == 0 else cell_y_start
            adjusted_y_end = cell_y_end - BOUNDARY_OFFSET if i == grid_size - 1 else cell_y_end
            adjusted_x_start = cell_x_start + BOUNDARY_OFFSET if j == 0 else cell_x_start
            adjusted_x_end = cell_x_end - BOUNDARY_OFFSET if j == grid_size - 1 else cell_x_end

            # Check for vertical wall (between cell (i,j) and (i,j+1))
            if j < grid_size - 1:  # Only check if there's a cell to the right
                has_wall = False
                for offset in range(-WALL_THICKNESS, WALL_THICKNESS + 1):
                    wall_x = cell_x_end + offset
                    if wall_x < 0 or wall_x >= width:
                        continue
                    wall_line = img_array[adjusted_y_start:adjusted_y_end, wall_x]
                    black_pixels = np.sum(np.all(np.abs(wall_line - BLACK) <= WALL_TOLERANCE, axis=1))
                    if black_pixels >= MIN_WALL_PIXELS:
                        has_wall = True
                        break
                vertical_row.append(int(has_wall))

            # Check for horizontal wall (between cell (i,j) and (i+1,j))
            if i < grid_size - 1:  # Only check if there's a cell below
                has_wall = False
                # Adjust the y-range to avoid top and bottom boundaries
                y_start_offset = -WALL_THICKNESS + BOUNDARY_OFFSET if i == 0 else -WALL_THICKNESS
                y_end_offset = WALL_THICKNESS - BOUNDARY_OFFSET if i == grid_size - 2 else WALL_THICKNESS
                for offset in range(y_start_offset, y_end_offset + 1):
                    wall_y = cell_y_end + offset
                    if wall_y < 0 or wall_y >= height:
                        continue
                    wall_line = img_array[wall_y, adjusted_x_start:adjusted_x_end]
                    black_pixels = np.sum(np.all(np.abs(wall_line - BLACK) <= WALL_TOLERANCE, axis=1))
                    if black_pixels >= MIN_WALL_PIXELS:
                        has_wall = True
                        break
                horizontal_row.append(int(has_wall))

        vertical_walls.append(vertical_row)
        if i < grid_size - 1:  # Only append horizontal walls for rows 0 to grid_size-2
            horizontal_walls.append(horizontal_row)

    # Step 7: Create the JSON structure
    maze_json = {
        "width": grid_size,
        "height": grid_size,
        "verticalWalls": vertical_walls,
        "horizontalWalls": horizontal_walls
    }

    if start:
        maze_json["start"] = start
    if end:
        maze_json["end"] = end

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

        # Write to thinmazeData.json
        with open('../thinmazeData.json', 'w') as f:  # Changed to write in the same directory
            json.dump(maze_json, f, indent=4)

        # Clean up the temporary file
        os.unlink(temp_file_path)

        return jsonify(maze_json)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/thinmazeData.json')
def serve_thin_maze_data():
    try:
        with open('../thinmazeData.json', 'r') as f:  # Changed to read from the same directory
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)