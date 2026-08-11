import { courses as baseCourses, students as baseStudents } from "@/features/Teacher/lib/mock-data";
import { apiJson, apiFetch } from "@/lib/api";

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

/** Composite course id is `{dept}-{sem}-{section}-{code}`. `dept` (e.g.
 * "information-technology") can itself contain dashes, so this must be
 * parsed from the right: `code` and `section` are never dash-bearing
 * (code has dashes stripped on creation), only `dept` is free-form. */
export function parseCourseId(compositeId: string) {
  const parts = compositeId.split("-");
  const code = parts.pop() ?? "";
  const section = parts.pop() ?? "d";
  const semStr = parts.pop() ?? "0";
  const dept = parts.join("-");
  return { dept, sem: Number(semStr), section, code };
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


export async function downloadCourseMarksReport(courseId: string, format: "pdf" | "xlsx"): Promise<void> {
  const res = await apiFetch(`/api/teacher/courses/${courseId}/marks/report?format=${format}`);
  const blob = await res.blob();

  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `internal-marks.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


export type PerformanceStudentRow = {
  student_id: string;
  name: string;
  enrollment: string;
  attendance_pct: number;
  marks_total: number;
};

export type CoursePerformanceDto = {
  course_id: string;
  code: string;
  name: string;
  credits: number;
  enrolled: number;
  avg_attendance: number;
  avg_marks: number;
  total_marks: number;
  students: PerformanceStudentRow[];
};

/** Real backend read: per-student attendance % + internal marks total for a course */
export async function getCoursePerformance(courseId: string): Promise<CoursePerformanceDto> {
  return apiJson<CoursePerformanceDto>(`/api/teacher/courses/${courseId}/performance`);
}

export type CourseOfferingSummary = {
  id: string;
  department_id: string;
  sem: number;
  section: string;
  enrolled: number;
  avg_attendance: number;
  avg_marks: number;
};

export type CourseAggregatePerformanceDto = {
  code: string;
  name: string;
  credits: number;
  enrolled: number;
  avg_attendance: number;
  avg_marks: number;
  total_marks: number;
  students: PerformanceStudentRow[];
  offerings: CourseOfferingSummary[];
};

/** Real backend read: performance combined across every section/semester
 * offering of a course code *within one department* — the course-level
 * summary shown before the teacher drills into one specific offering's
 * dashboard. department_id is required because the same course code can be
 * taught by the same teacher in more than one department (e.g. a shared
 * first-year course); those are different courses with different rosters
 * and must never be merged into one aggregate. */
export async function getCourseAggregatePerformance(
  code: string,
  departmentId: string,
): Promise<CourseAggregatePerformanceDto> {
  return apiJson<CourseAggregatePerformanceDto>(
    `/api/teacher/courses/by-code/${code}/${departmentId}/performance`,
  );
}

export type CourseOffering = {
  id: string;
  sem: number;
  section: string;
};

export type GroupedTeacherCourse = {
  code: string;
  name: string;
  credits: number;
  dept: string;
  offerings: CourseOffering[];
};

/** Groups a teacher's flat course list (one row per section/semester, since
 * each is a distinct Course row on the backend) into one entry per
 * (department, course code), with every (sem, section) offering attached —
 * so the UI can render "DBMS · Sem 5 · Sec M1, M2" instead of duplicate
 * cards for the same course. Keyed on dept+code, not code alone: the same
 * code taught in two departments (e.g. a shared first-year course) is two
 * distinct courses with separate rosters and must not collapse into one
 * card. */
export function groupTeacherCourses(courses: TeacherCourse[]): GroupedTeacherCourse[] {
  const map = new Map<string, GroupedTeacherCourse>();

  for (const c of courses) {
    const key = `${c.dept}::${c.code}`;
    if (!map.has(key)) {
      map.set(key, { code: c.code, name: c.name, credits: c.credits, dept: c.dept, offerings: [] });
    }
    map.get(key)!.offerings.push({ id: c.id, sem: c.sem, section: c.section ?? "d" });
  }

  const groups = Array.from(map.values());
  for (const g of groups) {
    g.offerings.sort((a, b) => a.sem - b.sem || a.section.localeCompare(b.section));
  }
  groups.sort((a, b) => (a.offerings[0]?.sem ?? 0) - (b.offerings[0]?.sem ?? 0) || a.code.localeCompare(b.code));
  return groups;
}