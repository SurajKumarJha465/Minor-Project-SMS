import os
import glob
import pickle
import numpy as np
import cv2
from insightface.app import FaceAnalysis

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
EMBEDDINGS_PATH = os.path.join(PROJECT_ROOT, "data", "known_embeddings.pkl")

face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)
face_app.prepare(ctx_id=0, det_size=(640, 640))

IMAGE_EXTENSIONS = ("*.jpg", "*.jpeg", "*.png")


def get_embedding(face_crop):
    faces = face_app.get(face_crop)
    if len(faces) == 0:
        return None
    face = max(faces, key=lambda f: f.det_score)
    return face.normed_embedding


def load_known_embeddings():
    if os.path.exists(EMBEDDINGS_PATH):
        with open(EMBEDDINGS_PATH, "rb") as f:
            return pickle.load(f)
    return {}


def save_known_embeddings(embeddings_dict):
    with open(EMBEDDINGS_PATH, "wb") as f:
        pickle.dump(embeddings_dict, f)


def enroll_student_from_folder(student_id, folder_path):
    """
    Enrolls a student using every photo found in folder_path (any count, 1+).
    Computes an embedding per photo, skips any photo where no face is
    detected, and averages the successful embeddings into a single
    re-normalized reference vector.
    """
    image_paths = []
    for ext in IMAGE_EXTENSIONS:
        image_paths.extend(glob.glob(os.path.join(folder_path, ext)))

    if not image_paths:
        print(f"No images found for {student_id} in {folder_path}, enrollment failed.")
        return False

    embeddings = []
    for path in sorted(image_paths):
        img = cv2.imread(path)
        if img is None:
            print(f"  Warning: could not read {path}, skipping.")
            continue

        embedding = get_embedding(img)
        if embedding is None:
            print(f"  Warning: no face detected in {path}, skipping.")
            continue

        embeddings.append(embedding)

    if not embeddings:
        print(f"No usable faces found for {student_id}, enrollment failed.")
        return False

    # average, then re-normalize back to unit length so cosine similarity
    # math in match_face() stays correct
    averaged = np.mean(embeddings, axis=0)
    averaged = averaged / np.linalg.norm(averaged)

    known = load_known_embeddings()
    known[student_id] = averaged
    save_known_embeddings(known)
    print(f"Enrolled {student_id} using {len(embeddings)}/{len(image_paths)} photo(s).")
    return True


def match_face(face_crop, threshold=0.5):
    embedding = get_embedding(face_crop)
    if embedding is None:
        return None, 0.0

    known = load_known_embeddings()
    if not known:
        return None, 0.0

    best_id, best_sim = None, -1.0
    for student_id, known_emb in known.items():
        sim = np.dot(embedding, known_emb)
        if sim > best_sim:
            best_id, best_sim = student_id, sim

    if best_sim >= threshold:
        return best_id, best_sim
    return None, best_sim