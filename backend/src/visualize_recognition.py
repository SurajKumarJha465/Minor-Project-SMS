import os
import cv2
from ultralytics import YOLO
from recognition import match_face, get_embedding, face_app

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "yolov11s-face.pt")
TEST_PHOTO = os.path.join(PROJECT_ROOT, "test_images", "all8.jpeg")  # swap to whichever photo you want
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "debug", "annotated_recognition.jpg")

model = YOLO(MODEL_PATH)
img = cv2.imread(TEST_PHOTO)
h, w = img.shape[:2]

results = model(TEST_PHOTO, imgsz=1280, conf=0.2)
padding = 0.3

for box in results[0].boxes:
    x1, y1, x2, y2 = map(int, box.xyxy[0])
    bw, bh = x2 - x1, y2 - y1
    px1 = max(0, int(x1 - bw * padding))
    py1 = max(0, int(y1 - bh * padding))
    px2 = min(w, int(x2 + bw * padding))
    py2 = min(h, int(y2 + bh * padding))

    face_crop = img[py1:py2, px1:px2]
    if face_crop.size == 0:
        continue

    student_id, sim = match_face(face_crop, threshold=0.4)

    if student_id:
        label = f"{student_id} ({sim:.2f})"
        color = (0, 200, 0)  # green box for a match
    else:
        label = "Unknown"
        color = (0, 0, 255)  # red box for unmatched

    cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
    cv2.putText(img, label, (x1, max(y1 - 8, 12)),
                cv2.FONT_HERSHEY_SIMPLEX, 3.5, color, 6)

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
cv2.imwrite(OUTPUT_PATH, img)
print(f"Saved annotated image to {OUTPUT_PATH}")