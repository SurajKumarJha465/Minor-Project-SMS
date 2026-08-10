import { courses as baseCourses, students as baseStudents } from "@/features/Teacher/lib/mock-data";
import { apiJson } from "@/lib/api";

export const departments = [
  { id: "ce", name: "Computer Engineering", code: "CE" },
  { id: "ee", name: "Electrical Engineering", code: "EE" },
  { id: "me", name: "Mechanical Engineering", code: "ME" },
] as const;

export const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

export const sections = [
  { id: "d", label: "D" },
  { id: "m1", label: "M1" },
  { id: "m2", label: "M2" },
] as const;

export type DeptId = (typeof departments)[number]["id"];
export type SectionId = (typeof sections)[number]["id"];

export type TeacherCourse = {
  id: string;
  code: string;
  name: string;
  credits: number;
  sem: number;
  dept: string;
  enrolled: number;
  section?: string;
  attendance?: number; // UI-only placeholder until backend provides %
};

export type CourseDto = {
  id: string;
  code: string;
  name: string;
  credits: number;
  sem: number;
  dept: string;
  enrolled: number;
};

export type RosterStudentDto = {
  id: string;
  name: string;
  enrollment: string;
  photo?: string | null;
};

export function getAssignedCourses(deptId: string, sem: number, sectionId: string) {
  const seed = (deptId.length + sem + sectionId.length) % baseCourses.length;
  const count = 2 + ((sem + sectionId.length) % 3);
  return Array.from({ length: count }, (_, i) => {
    const c = baseCourses[(seed + i) % baseCourses.length];
    return {
      ...c,
      id: `${deptId}-${sem}-${sectionId}-${c.id}`,
      dept: deptId,
      sem,
      section: sectionId,
    };
  });
}

export function getRosterFor(deptId: string, sem: number, sectionId: string) {
  const seed = (deptId.length * 3 + sem * 7 + sectionId.length * 5) % baseStudents.length;
  const count = 14 + (sem % 6);
  return Array.from({ length: count }, (_, i) => baseStudents[(seed + i) % baseStudents.length]);
}

export function parseCourseId(compositeId: string) {
  const [dept, semStr, section] = compositeId.split("-");
  return { dept, sem: Number(semStr), section };
}

/** Real backend read: current teacher's assigned courses */
export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  try {
    const list = await apiJson<TeacherCourse[]>("/api/teacher/courses");
    return list.map((c) => ({
      ...c,
      section: parseCourseId(c.id).section ?? "d",
      attendance: c.attendance ?? 0,
    }));
  } catch {
    return [];
  }
}

/** Real backend read with mock fallback */
export async function getCourseByCompositeId(courseId: string): Promise<CourseDto | null> {
  try {
    return await apiJson<CourseDto>(`/api/courses/${courseId}`);
  } catch {
    return getMockCourse(courseId) ?? null;
  }
}

/** Real backend read with mock fallback */
export async function getRosterForCourse(courseId: string): Promise<RosterStudentDto[]> {
  try {
    return await apiJson<RosterStudentDto[]>(`/api/courses/${courseId}/roster`);
  } catch {
    const { dept, sem, section } = parseCourseId(courseId);
    return getRosterFor(dept, sem, section);
  }
}

export function getMockCourse(compositeId: string) {
  const { dept, sem, section } = parseCourseId(compositeId);
  return getAssignedCourses(dept, sem, section).find((c) => c.id === compositeId);
}

export function deptName(id: string) {
  return departments.find((d) => d.id === id)?.name ?? id;
}

export function sectionLabel(id: string) {
  return sections.find((s) => s.id === id)?.label ?? id;
}

export type TeacherMeDto = {
  id: number;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  office?: string | null;
  office_hours?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  experience?: string | null;
  photo?: string | null;
  username: string;
  must_change_password: boolean;
  two_factor_enabled: boolean;
};

export type TeacherActivityDto = {
  icon: "check" | "award" | "bell" | "file" | "message";
  title: string;
  desc: string;
  created_at: string;
};

/** Real backend read: current teacher's own profile */
export async function getTeacherMe(): Promise<TeacherMeDto | null> {
  try {
    return await apiJson<TeacherMeDto>("/api/teacher/me");
  } catch {
    return null;
  }
}

/** Real backend read: current teacher's recent activity feed */
export async function getTeacherActivity(limit = 10): Promise<TeacherActivityDto[]> {
  try {
    return await apiJson<TeacherActivityDto[]>(`/api/teacher/activity?limit=${limit}`);
  } catch {
    return [];
  }
}

export type TeacherDepartmentDto = { id: string; name: string; code: string };

/** Real backend read: departments this teacher is actually assigned to —
 * scoped, not the full institution-wide list (that one's in `departments` above,
 * which is otherwise-unused mock data for now). */
export async function getTeacherDepartments(): Promise<TeacherDepartmentDto[]> {
  try {
    return await apiJson<TeacherDepartmentDto[]>("/api/teacher/departments");
  } catch {
    return [];
  }
}

export type MarkFields = {
  p_att: number; p_lab: number; p_exam: number; p_viva: number;
  t_att: number; t_assign: number; t_present: number; t_assess: number;
};

export type MarkRow = MarkFields & {
  student_id: string; name: string; enrollment: string; status: "draft" | "published";
};

export async function getCourseMarks(courseId: string): Promise<MarkRow[]> {
  return apiJson<MarkRow[]>(`/api/teacher/courses/${courseId}/marks`);
}

export async function saveCourseMarks(courseId: string, rows: (MarkFields & { student_id: string })[]) {
  return apiJson<{ saved: number }>(`/api/teacher/courses/${courseId}/marks`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
}

export async function publishCourseMarks(courseId: string) {
  return apiJson<{ published: number }>(`/api/teacher/courses/${courseId}/marks/publish`, { method: "POST" });
}