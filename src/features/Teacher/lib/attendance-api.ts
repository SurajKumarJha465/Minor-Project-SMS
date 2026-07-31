import { apiFormJson } from "@/lib/api";

export type Status = "present" | "absent" | "pending";
export type MarkSource = "ai" | "manual";

export type AttendanceEntry = {
  status: Status;
  similarity?: number | null;
  source?: MarkSource;
};

export type RecognizedFace = {
  student_id: string;
  similarity?: number;
};

export type RecognizeResponse = {
  recognized?: RecognizedFace[];
};

export type SaveAttendanceResponse = {
  saved: number;
};

export async function recognizeAttendanceFrame(input: {
  courseId: string;
  frameBlob: Blob;
}): Promise<RecognizeResponse> {
  const formData = new FormData();
  formData.append("course_id", input.courseId);
  formData.append("frame", input.frameBlob, "frame.jpg");
  return apiFormJson<RecognizeResponse>("/api/attendance/recognize", formData);
}

export async function saveAttendance(input: {
  courseId: string;
  statuses: Record<string, AttendanceEntry>;
}): Promise<SaveAttendanceResponse> {
  const formData = new FormData();
  formData.append("course_id", input.courseId);
  formData.append("statuses", JSON.stringify(input.statuses));
  return apiFormJson<SaveAttendanceResponse>("/api/attendance/save", formData);
}