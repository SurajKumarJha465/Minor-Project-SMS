import { courses as baseCourses, students as baseStudents } from "@/features/Teacher/lib/mock-data";
import { authHeader } from "@/lib/auth";

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
  attendance?: number; // UI-only fallback for course cards that display %
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

const RECOGNITION_API =
  (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  try {
    const res = await fetch(`${RECOGNITION_API}/api/teacher/courses`, {
      headers: authHeader(),
    });

    if (res.status === 401 || res.status === 403) return [];
    if (!res.ok) return [];

    const list = (await res.json()) as TeacherCourse[];
    return list.map((c) => ({
      ...c,
      section: parseCourseId(c.id).section ?? "d",
      attendance: c.attendance ?? 0, // until backend provides real %
    }));
  } catch {
    return [];
  }
}

// Real backend reads with auth header.
// Falls back to deterministic mock when offline/unavailable.
export async function getCourseByCompositeId(courseId: string) {
  try {
    const res = await fetch(`${RECOGNITION_API}/api/courses/${courseId}`, {
      headers: authHeader(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return getMockCourse(courseId) ?? null;
  }
}

export async function getRosterForCourse(courseId: string) {
  try {
    const res = await fetch(`${RECOGNITION_API}/api/courses/${courseId}/roster`, {
      headers: authHeader(),
    });
    if (!res.ok) return [];
    return await res.json();
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