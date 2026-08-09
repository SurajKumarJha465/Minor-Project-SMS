import { apiJson, apiFormJson } from "@/lib/api";

export type Status = "pending" | "present" | "absent";

export type AttendanceEntry = {
  status: Status;
  source: "ai" | "manual";
  similarity: number | null;
};

type RecognizeResponse = {
  recognized: { student_id: string; similarity: number }[];
};

type TodayAttendanceResponse = {
  course_id: string;
  date: string;
  records: {
    student_id: string;
    status: Status;
    similarity: number | null;
    marked_by: string;
  }[];
};

/** POST /api/attendance/recognize — multipart: course_id + captured frame */
export async function recognizeAttendanceFrame({
  courseId,
  frameBlob,
}: {
  courseId: string;
  frameBlob: Blob;
}): Promise<RecognizeResponse> {
  const form = new FormData();
  form.append("course_id", courseId);
  form.append("frame", frameBlob, "frame.jpg");
  return apiFormJson<RecognizeResponse>("/api/attendance/recognize", form);
}

/** POST /api/attendance/save — multipart: course_id + statuses (JSON string) */
export async function saveAttendance({
  courseId,
  statuses,
}: {
  courseId: string;
  statuses: Record<string, AttendanceEntry>;
}): Promise<{ saved: number }> {
  const form = new FormData();
  form.append("course_id", courseId);
  form.append("statuses", JSON.stringify(statuses));
  return apiFormJson<{ saved: number }>("/api/attendance/save", form);
}

/** GET /api/attendance/today?course_id=... — today's records for the roster.
 * Empty/unavailable is handled by the caller (route .catch(() => null)),
 * so this just lets errors propagate rather than swallowing them. */
export async function getTodayAttendance(courseId: string): Promise<TodayAttendanceResponse> {
  return apiJson<TodayAttendanceResponse>(
    `/api/attendance/today?course_id=${encodeURIComponent(courseId)}`,
  );
}