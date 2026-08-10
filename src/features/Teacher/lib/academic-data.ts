// --- academic-data.ts ---

// BEFORE (buggy — breaks whenever dept id contains a dash, e.g. "information-technology"):
//
// export function parseCourseId(compositeId: string) {
//   const [dept, semStr, section] = compositeId.split("-");
//   return { dept, sem: Number(semStr), section };
// }

// AFTER — parse from the right. `code` is always dash-free (stripped on creation)
// and `section` currently is too, so only `dept` is allowed to contain dashes.
export function parseCourseId(compositeId: string) {
  const parts = compositeId.split("-");
  const code = parts.pop() ?? "";
  const section = parts.pop() ?? "d";
  const semStr = parts.pop() ?? "0";
  const dept = parts.join("-"); // reassembles "information-technology" correctly
  return { dept, sem: Number(semStr), section, code };
}

// --- new: group a teacher's flat course list into one entry per course,
// with every (sem, section) offering attached, so the profile can render
// "DBMS · Sem 5 · Sec M1, M2  |  Sem 6 · Sec D" instead of 3 duplicate cards ---

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

export function groupTeacherCourses(courses: TeacherCourse[]): GroupedTeacherCourse[] {
  const map = new Map<string, GroupedTeacherCourse>();

  for (const c of courses) {
    // group by course code, not name — two different courses could share a name
    const key = c.code;
    if (!map.has(key)) {
      map.set(key, { code: c.code, name: c.name, credits: c.credits, dept: c.dept, offerings: [] });
    }
    map.get(key)!.offerings.push({ id: c.id, sem: c.sem, section: c.section ?? "d" });
  }

  const groups = Array.from(map.values());
  for (const g of groups) {
    g.offerings.sort((a, b) => a.sem - b.sem || a.section.localeCompare(b.section));
  }
  // stable ordering: by lowest sem taught, then course code
  groups.sort((a, b) => (a.offerings[0]?.sem ?? 0) - (b.offerings[0]?.sem ?? 0) || a.code.localeCompare(b.code));
  return groups;
}