from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import cv2
import numpy as np
from PIL import Image
import re
import io
import base64
import pytesseract

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR reader for English
reader = easyocr.Reader(['en'])
print("EasyOCR model loaded successfully!")

def preprocess_for_license_plate(image):
    """Specialized preprocessing for license plate detection"""
    results = []
    
    # Original image
    results.append(image)
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Method 1: CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    clahe_img = clahe.apply(gray)
    results.append(cv2.cvtColor(clahe_img, cv2.COLOR_GRAY2BGR))
    
    # Method 2: Gaussian blur + threshold
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results.append(cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR))
    
    # Method 3: Morphological operations for license plate enhancement
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    morph = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
    morph = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel)
    results.append(cv2.cvtColor(morph, cv2.COLOR_GRAY2BGR))
    
    # Method 4: Edge detection + dilation
    edges = cv2.Canny(gray, 50, 150)
    kernel = np.ones((2, 2), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=1)
    results.append(cv2.cvtColor(dilated, cv2.COLOR_GRAY2BGR))
    
    return results

def extract_license_plate(all_text_results):
    """Enhanced license plate extraction with better pattern matching"""
    valid_states = ['AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 
                   'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PB', 'RJ', 
                   'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB', 'DL', 'PY', 'CH', 'AN', 
                   'DN', 'DD', 'LD']
    
    best_matches = []
    
    # Try each set of OCR results
    for text_results in all_text_results:
        if not text_results:
            continue
            
        # Process each detected text separately first
        for result in text_results:
            text = result[1].upper().strip()
            confidence = result[2] if len(result) > 2 else 0.5
            
            # Clean the text
            cleaned = re.sub(r'[^A-Z0-9\s-]', '', text)
            
            # Enhanced patterns for Indian license plates
            patterns = [
                r'\b([A-Z]{2})[-\s]*([0-9]{1,2})[-\s]*([A-Z]{1,2})[-\s]*([0-9]{3,4})\b',
                r'\b([A-Z]{2})([0-9]{2})([A-Z]{2})([0-9]{4})\b',
                r'([A-Z]{2})\s*([0-9]{1,2})\s*([A-Z]{1,2})\s*([0-9]{3,4})',
            ]
            
            for pattern in patterns:
                matches = re.finditer(pattern, cleaned)
                for match in matches:
                    state, district, letters, numbers = match.groups()
                    
                    # Validate components
                    if (state in valid_states and 
                        len(district) <= 2 and district.isdigit() and
                        len(letters) <= 2 and letters.isalpha() and 
                        len(numbers) >= 3 and len(numbers) <= 4 and numbers.isdigit()):
                        
                        formatted_plate = f"{state}-{district.zfill(2)}-{letters}-{numbers}"
                        best_matches.append((formatted_plate, confidence, len(text)))
        
        # Also try combined text
        if text_results:
            combined_text = ' '.join([result[1] for result in text_results]).upper()
            combined_text = re.sub(r'[^A-Z0-9\s-]', '', combined_text)
            
            # Look for license plate in combined text
            pattern = r'\b([A-Z]{2})[-\s]*([0-9]{1,2})[-\s]*([A-Z]{1,2})[-\s]*([0-9]{3,4})\b'
            matches = re.finditer(pattern, combined_text)
            for match in matches:
                state, district, letters, numbers = match.groups()
                if state in valid_states:
                    formatted_plate = f"{state}-{district.zfill(2)}-{letters}-{numbers}"
                    best_matches.append((formatted_plate, 0.8, len(combined_text)))
    
    # Return the best match (highest confidence, then shortest text)
    if best_matches:
        best_matches.sort(key=lambda x: (-x[1], x[2]))
        return best_matches[0][0]
    
    return None

@app.route('/detect-plate', methods=['POST'])
def detect_plate():
    try:
        # Get image from request
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image provided'})
        
        image_file = request.files['image']
        
        # Convert to OpenCV format
        image_bytes = image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image format'})
        
        # Method 1: EasyOCR with multiple preprocessing
        processed_images = preprocess_for_license_plate(image)
        all_results = []
        raw_texts = []
        
        # Try EasyOCR on each processed image
        for i, proc_img in enumerate(processed_images):
            try:
                easy_results = reader.readtext(proc_img)
                all_results.append(easy_results)
                raw_texts.extend([f"EasyOCR-{i+1}: {result[1]}" for result in easy_results])
            except Exception as e:
                print(f"EasyOCR method {i+1} failed: {e}")
                all_results.append([])
        
        # Method 2: Tesseract OCR with custom config
        for i, proc_img in enumerate(processed_images[:3]):
            try:
                # Convert to PIL Image
                pil_img = Image.fromarray(cv2.cvtColor(proc_img, cv2.COLOR_BGR2RGB))
                
                # Tesseract config for license plates
                custom_config = r'--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                
                # Extract text
                text = pytesseract.image_to_string(pil_img, config=custom_config).strip().upper()
                
                if text:
                    # Create EasyOCR-like format
                    tesseract_results = [[(0, 0, 0, 0), text, 0.8]]
                    all_results.append(tesseract_results)
                    raw_texts.append(f"Tesseract-{i+1}: {text}")
                else:
                    all_results.append([])
            except Exception as e:
                print(f"Tesseract method {i+1} failed: {e}")
                all_results.append([])
        
        # Extract license plate from all results
        license_plate = extract_license_plate(all_results)
        
        if license_plate:
            return jsonify({
                'success': True, 
                'license_plate': license_plate,
                'raw_text': raw_texts
            })
        else:
            return jsonify({
                'success': False, 
                'error': 'No valid license plate detected',
                'raw_text': raw_texts
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI service running'})

if __name__ == '__main__':
    print("Starting AI License Plate Detection Service...")
    app.run(host='0.0.0.0', port=5001, debug=True)