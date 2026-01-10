import cv2
import os
import face_recognition
import pickle

def find_encodings(images_list):
    """Generate face encodings from images"""
    encode_list = []
    
    for idx, img in enumerate(images_list):
        if img is None:
            print(f"Warning: Could not read image at index {idx}")
            continue
            
        try:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            encodings = face_recognition.face_encodings(img)
            
            if len(encodings) == 0:
                print(f"Warning: No face detected in image at index {idx}")
                encode_list.append(None)
            elif len(encodings) > 1:
                print(f"Warning: Multiple faces detected in image at index {idx}, using first face")
                encode_list.append(encodings[0])
            else:
                encode_list.append(encodings[0])
                
        except Exception as e:
            print(f"Error encoding image at index {idx}: {str(e)}")
            encode_list.append(None)
    
    return encode_list

def generate_encodings():
    """Main function to generate and save face encodings"""
    try:
        # Check if Images folder exists
        folder_path = 'Images'
        if not os.path.exists(folder_path):
            print(f"Error: '{folder_path}' folder not found!")
            print("Please create an 'Images' folder and add student images.")
            print("Image names should be the student IDs (e.g., 321654.jpg)")
            return False
        
        # Get image files
        path_list = os.listdir(folder_path)
        
        # Filter only image files
        valid_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        path_list = [p for p in path_list if os.path.splitext(p)[1].lower() in valid_extensions]
        
        if len(path_list) == 0:
            print(f"Error: No image files found in '{folder_path}' folder!")
            print(f"Supported formats: {', '.join(valid_extensions)}")
            return False
        
        print(f"Found {len(path_list)} images: {path_list}")
        
        # Load images
        img_list = []
        student_ids = []
        
        for path in path_list:
            img_path = os.path.join(folder_path, path)
            img = cv2.imread(img_path)
            
            if img is not None:
                img_list.append(img)
                student_id = os.path.splitext(path)[0]
                student_ids.append(student_id)
                print(f"Loaded: {path} -> ID: {student_id}")
            else:
                print(f"Warning: Could not read image '{path}'")
        
        if len(img_list) == 0:
            print("Error: No valid images could be loaded!")
            return False
        
        print(f"\nSuccessfully loaded {len(img_list)} images")
        print(f"Student IDs: {student_ids}")
        
        # Generate encodings
        print('\n' + '='*50)
        print('Encoding Started...')
        print('='*50)
        
        encode_list_known = find_encodings(img_list)
        
        # Filter out None encodings
        valid_encodings = []
        valid_ids = []
        failed_ids = []
        
        for encode, student_id in zip(encode_list_known, student_ids):
            if encode is not None:
                valid_encodings.append(encode)
                valid_ids.append(student_id)
            else:
                failed_ids.append(student_id)
                print(f"✗ Failed to encode: {student_id}")
        
        if len(valid_encodings) == 0:
            print("\nError: No valid face encodings could be generated!")
            print("Please ensure:")
            print("1. Images contain clear, visible faces")
            print("2. Images are not corrupted")
            print("3. Face is facing forward")
            return False
        
        print('\n' + '='*50)
        print(f'✓ Encoding Complete')
        print(f'  Successfully encoded: {len(valid_encodings)} faces')
        if failed_ids:
            print(f'  Failed to encode: {len(failed_ids)} faces')
            print(f'  Failed IDs: {failed_ids}')
        print('='*50)
        
        # Save encodings
        encode_list_known_with_ids = [valid_encodings, valid_ids]
        
        try:
            with open("EncodeFile.p", 'wb') as file:
                pickle.dump(encode_list_known_with_ids, file)
            
            print("\n✓ Encoding file saved successfully as 'EncodeFile.p'")
            print(f"  Total students encoded: {len(valid_ids)}")
            print(f"  Student IDs: {valid_ids}")
            return True
            
        except Exception as e:
            print(f"\nError saving encoding file: {str(e)}")
            return False
        
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("="*50)
    print("Face Encoding Generator")
    print("="*50)
    print()
    
    success = generate_encodings()
    
    print("\n" + "="*50)
    if success:
        print("✓ ENCODING GENERATION COMPLETED SUCCESSFULLY!")
        print("  You can now run main.py to start attendance system")
    else:
        print("✗ ENCODING GENERATION FAILED!")
        print("  Please fix the issues above and try again")
    print("="*50)