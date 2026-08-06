import os
from recognition import enroll_student_from_folder

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ENROLLMENT_DIR = os.path.join(PROJECT_ROOT, "data", "enrollment_photos")

def main():
    if not os.path.isdir(ENROLLMENT_DIR):
        print(f"No enrollment directory found at {ENROLLMENT_DIR}")
        return

    student_folders = sorted(
        d for d in os.listdir(ENROLLMENT_DIR)
        if os.path.isdir(os.path.join(ENROLLMENT_DIR, d))
    )

    if not student_folders:
        print(f"No student folders found in {ENROLLMENT_DIR}")
        return

    print(f"Found {len(student_folders)} student folder(s): {student_folders}")
    print()

    success_count = 0
    for student_id in student_folders:
        folder_path = os.path.join(ENROLLMENT_DIR, student_id)
        if enroll_student_from_folder(student_id, folder_path):
            success_count += 1
        print()

    print(f"Enrollment complete: {success_count}/{len(student_folders)} student(s) enrolled successfully.")


if __name__ == "__main__":
    main()