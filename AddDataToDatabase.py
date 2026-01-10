import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from datetime import datetime

def initialize_firebase():
    """Initialize Firebase only if not already initialized"""
    try:
        firebase_admin.get_app()
        print("Firebase already initialized")
    except ValueError:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://automated-attendance-sys-7132e-default-rtdb.firebaseio.com/'
        })
        print("Firebase initialized successfully")

def add_student_data():
    """Add student data to Firebase database"""
    try:
        initialize_firebase()
        
        ref = db.reference('Students')
        
        # Get current timestamp
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        data = {
            "321654": {
                "name": "Kaushal Kumar",
                "major": "Computer Science",
                "starting_year": 2022,
                "total_attendance": 0,
                "standing": "Good",
                "year": 4,
                "branch": "CSE",
                "last_attendance_time": current_time
            },
            "852741": {
                "name": "Nibedita Misra",
                "major": "Psychology",
                "starting_year": 2022,
                "total_attendance": 0,
                "standing": "Good",
                "year": 4,
                "branch": "Humanities",
                "last_attendance_time": current_time
            },
            "963852": {
                "name": "Rishabh Raj",
                "major": "Theory of Structures",
                "starting_year": 2020,
                "total_attendance": 0,
                "standing": "Good",
                "year": 5,
                "branch": "Architectural Design",
                "last_attendance_time": current_time
            }
        }
        
        print("Adding student data to database...")
        for key, value in data.items():
            ref.child(key).set(value)
            print(f"Added student: {value['name']} (ID: {key})")
        
        print("\nAll student data added successfully!")
        return True
        
    except FileNotFoundError:
        print("Error: serviceAccountKey.json file not found!")
        print("Please ensure the Firebase service account key is in the same directory.")
        return False
    except Exception as e:
        print(f"Error adding student data: {str(e)}")
        return False

if __name__ == "__main__":
    add_student_data()