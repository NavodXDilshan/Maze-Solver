from flask import Flask, request, jsonify
from PIL import Image
import io
import numpy as np

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    # Open the image using PIL
    img = Image.open(file.stream).convert('L')  # Convert to grayscale
    img_array = np.array(img)  # Convert to numpy array
    
    # Placeholder for image-to-maze conversion logic
    maze = process_image_to_maze(img_array)
    
    # Return some response (e.g., maze dimensions or the maze itself)
    return jsonify({
        'message': 'Image processed successfully',
        'width': img_array.shape[1],
        'height': img_array.shape[0],
        'maze': maze.tolist()  # Convert maze to list for JSON serialization
    })

def process_image_to_maze(img_array):
    # Simple example: Convert image to binary maze (0s and 1s)
    # 0 = wall (dark pixels), 1 = path (light pixels)
    threshold = 128  # Adjust threshold as needed
    maze = (img_array > threshold).astype(int)
    return maze

print("App Running")
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)