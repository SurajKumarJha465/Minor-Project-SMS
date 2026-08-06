import os
import cv2
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "yolov11s-face.pt")
IMAGE_PATH = os.path.join(PROJECT_ROOT, "test_images", "26-07-01-07-13-44.jpg.jpeg")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "debug", "cropped_faces")


def get_face_crops(image_path, model, conf_threshold=0.25, imgsz=1280, padding=0.3):
    results = model(image_path, imgsz=imgsz, conf=conf_threshold)
    img = cv2.imread(image_path)

    if img is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    h, w = img.shape[:2]
    crops = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        bw, bh = x2 - x1, y2 - y1
        x1 = max(0, int(x1 - bw * padding))
        y1 = max(0, int(y1 - bh * padding))
        x2 = min(w, int(x2 + bw * padding))
        y2 = min(h, int(y2 + bh * padding))

        face_crop = img[y1:y2, x1:x2]
        if face_crop.size == 0:
            continue

        crops.append(face_crop)

    return crops


def main():
    model = YOLO(MODEL_PATH)

    crops = get_face_crops(IMAGE_PATH, model, conf_threshold=0.2, imgsz=1280)
    print(f"Found {len(crops)} face(s)")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for i, crop in enumerate(crops):
        cv2.imwrite(os.path.join(OUTPUT_DIR, f"face_{i}.jpg"), crop)

    print(f"Saved {len(crops)} face crops to '{OUTPUT_DIR}/'")


if __name__ == "__main__":
    main()