import sys
from PIL import Image
import numpy as np

def main():
    if len(sys.argv) < 2:
        print("Error: No image path provided")
        return
    
    img_path = sys.argv[1]
    img = Image.open(img_path).convert('L')
    img_array = np.array(img)
    
    # Example additional processing
    print(f"Processing image: {img_path}")
    print(f"Image size: {img_array.shape}")
    # Add your maze processing logic here
 
print("App Running splendidly")   
if __name__ == "__main__":
    main()