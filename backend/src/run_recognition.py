import os
from ultralytics import YOLO
from detection import get_face_crops
from recognition import match_face

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "yolov11s-face.pt")
TEST_PHOTO = os.path.join(PROJECT_ROOT, "test_images", "all8.jpeg")

model = YOLO(MODEL_PATH)

test_crops = get_face_crops(TEST_PHOTO, model, conf_threshold=0.2, imgsz=1280)
print(f"Test photo: found {len(test_crops)} face(s)")

for i, crop in enumerate(test_crops):
    student_id, sim = match_face(crop, threshold=0.4)
    if student_id:
        print(f"Face {i}: Matched '{student_id}' (similarity={sim:.3f})")
    else:
        print(f"Face {i}: Unknown (best similarity={sim:.3f})")