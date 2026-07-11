import { courses as baseCourses, students as baseStudents } from "@/lib/mock-data";

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

// Deterministic mock: courses assigned to a given dept + semester + section.
// Reuses the base course catalogue so every path resolves to real-looking data.
export function getAssignedCourses(deptId: string, sem: number, sectionId: string) {
  const seed = (deptId.length + sem + sectionId.length) % baseCourses.length;
  const count = 2 + ((sem + sectionId.length) % 3); // 2-4 courses
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

// Deterministic mock roster for a given course path.
export function getRosterFor(deptId: string, sem: number, sectionId: string) {
  const seed = (deptId.length * 3 + sem * 7 + sectionId.length * 5) % baseStudents.length;
  const count = 14 + (sem % 6);
  return Array.from({ length: count }, (_, i) => baseStudents[(seed + i) % baseStudents.length]);
}

export function parseCourseId(compositeId: string) {
  const [dept, semStr, section] = compositeId.split("-");
  return { dept, sem: Number(semStr), section };
}

export function getCourseByCompositeId(compositeId: string) {
  const { dept, sem, section } = parseCourseId(compositeId);
  return getAssignedCourses(dept, sem, section).find((c) => c.id === compositeId);
}

export function deptName(id: string) {
  return departments.find((d) => d.id === id)?.name ?? id;
}
export function sectionLabel(id: string) {
  return sections.find((s) => s.id === id)?.label ?? id;
}
