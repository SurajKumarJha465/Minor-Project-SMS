"""Server-side PDF report generation for student-facing downloads.

Replaces the old frontend `downloadMockPdf()` stub (a hand-rolled, client-side
placeholder PDF) with real reports built from the same data the on-screen
pages already show, rendered with reportlab and returned as bytes for a
FastAPI StreamingResponse.

Kept deliberately generic (one `_render` helper + small per-report builders)
since Attendance / Internal Marks / Semester Results all share the same
shape: a letterhead, a student info block, a summary line, and a table.
"""

from __future__ import annotations

from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

_STYLES = getSampleStyleSheet()
_TITLE_STYLE = ParagraphStyle(
    "ReportTitle", parent=_STYLES["Title"], fontSize=16, spaceAfter=2,
)
_INSTITUTION_STYLE = ParagraphStyle(
    "Institution", parent=_STYLES["Normal"], fontSize=11, textColor=colors.HexColor("#4b5563"),
)
_META_STYLE = ParagraphStyle(
    "Meta", parent=_STYLES["Normal"], fontSize=9, textColor=colors.HexColor("#6b7280"),
)
_SECTION_STYLE = ParagraphStyle(
    "Section", parent=_STYLES["Heading3"], fontSize=11, spaceBefore=10, spaceAfter=4,
)
_FOOTER_STYLE = ParagraphStyle(
    "Footer", parent=_STYLES["Normal"], fontSize=8, textColor=colors.HexColor("#9ca3af"),
)

_ACCENT = colors.HexColor("#4f46e5")
_ROW_ALT = colors.HexColor("#f3f4f6")


def _student_info_table(student_info: dict[str, str]) -> Table:
    pairs = list(student_info.items())
    rows = []
    for i in range(0, len(pairs), 2):
        label, value = pairs[i]
        if i + 1 < len(pairs):
            label2, value2 = pairs[i + 1]
        else:
            label2, value2 = "", ""
        rows.append([f"{label}:", value, f"{label2}:" if label2 else "", value2])
    t = Table(rows, colWidths=[28 * mm, 55 * mm, 28 * mm, 55 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
        ("TEXTCOLOR", (2, 0), (2, -1), colors.HexColor("#374151")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def _data_table(headers: list[str], rows: list[list[str]], col_widths: list[float] | None = None) -> Table:
    data = [headers] + rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), _ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _ROW_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def _render(
    *,
    institution_name: str,
    report_title: str,
    student_info: dict[str, str],
    summary_lines: list[str],
    sections: list[tuple[str, list[str], list[list[str]], list[float] | None]],
    generated_note: str | None = None,
) -> bytes:
    """sections: list of (heading, table_headers, table_rows, col_widths)."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=18 * mm, bottomMargin=16 * mm, leftMargin=18 * mm, rightMargin=18 * mm,
        title=report_title,
    )

    story = []
    story.append(Paragraph(institution_name or "Smart Student Management System", _INSTITUTION_STYLE))
    story.append(Paragraph(report_title, _TITLE_STYLE))
    story.append(Paragraph(f"Generated {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}", _META_STYLE))
    story.append(Spacer(1, 8))
    story.append(_student_info_table(student_info))
    story.append(Spacer(1, 6))

    if summary_lines:
        for line in summary_lines:
            story.append(Paragraph(line, _STYLES["Normal"]))
        story.append(Spacer(1, 4))

    for heading, headers, rows, widths in sections:
        if heading:
            story.append(Paragraph(heading, _SECTION_STYLE))
        if rows:
            story.append(_data_table(headers, rows, widths))
        else:
            story.append(Paragraph("No records to show.", _STYLES["Normal"]))
        story.append(Spacer(1, 6))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        generated_note or "This is a system-generated document and does not require a signature.",
        _FOOTER_STYLE,
    ))

    doc.build(story)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Report builders — one per student-facing download button.
# ---------------------------------------------------------------------------

def build_attendance_report(
    *, institution_name: str, student_info: dict[str, str],
    summary: dict, courses: list[dict],
) -> bytes:
    summary_lines = [
        f"<b>Overall attendance:</b> {summary['overall']}% "
        f"&nbsp;&nbsp; <b>Total classes:</b> {summary['total_classes']} "
        f"&nbsp;&nbsp; <b>Present:</b> {summary['present']} "
        f"&nbsp;&nbsp; <b>Absent:</b> {summary['absent']}",
    ]
    rows = [
        [c["code"], c["name"], c["teacher"], str(c["present"]), str(c["absent"]), f"{c['percentage']}%", c["status"]]
        for c in courses
    ]
    headers = ["Code", "Course", "Teacher", "Present", "Absent", "%", "Status"]
    widths = [18 * mm, 45 * mm, 32 * mm, 18 * mm, 18 * mm, 15 * mm, 20 * mm]
    return _render(
        institution_name=institution_name,
        report_title="Attendance Report",
        student_info=student_info,
        summary_lines=summary_lines,
        sections=[("Course-wise Attendance", headers, rows, widths)],
    )


def build_internal_marks_report(
    *, institution_name: str, student_info: dict[str, str],
    rows: list[dict],
) -> bytes:
    published = [r for r in rows if r["status"] == "published"]
    avg = round(sum(r["total"] for r in published) / len(published)) if published else 0
    summary_lines = [
        f"<b>Average internal score:</b> {avg}/50 across {len(published)} published course"
        f"{'s' if len(published) != 1 else ''}"
        + (f" &nbsp;&nbsp; <b>Pending:</b> {len(rows) - len(published)}" if len(rows) > len(published) else ""),
    ]
    table_rows = []
    for r in rows:
        is_pub = r["status"] == "published"
        practical = r["p_att"] + r["p_lab"] + r["p_exam"] + r["p_viva"]
        theory = r["t_att"] + r["t_assign"] + r["t_present"] + r["t_assess"]
        table_rows.append([
            r["code"], r["name"], r["teacher"],
            str(practical) if is_pub else "—",
            str(theory) if is_pub else "—",
            f"{r['total']}/50" if is_pub else "—",
            "Published" if is_pub else "Pending",
        ])
    headers = ["Code", "Course", "Teacher", "Practical /20", "Theory /30", "Total", "Status"]
    widths = [18 * mm, 42 * mm, 30 * mm, 24 * mm, 22 * mm, 18 * mm, 20 * mm]
    return _render(
        institution_name=institution_name,
        report_title="Internal Marks Report",
        student_info=student_info,
        summary_lines=summary_lines,
        sections=[("Course-wise Internal Assessment", headers, table_rows, widths)],
    )


def build_course_internal_marks_report(
    *, institution_name: str, course_info: dict[str, str], rows: list[dict],
) -> bytes:
    headers = ["Enrollment", "Name", "Att", "Lab", "Exam", "Viva", "Att", "Assign", "Pres", "Assess", "Practical", "Theory", "Total /50"]
    widths = [22 * mm, 38 * mm] + [10 * mm] * 8 + [16 * mm, 14 * mm, 16 * mm]

    table_rows = []
    for r in rows:
        practical = r["p_att"] + r["p_lab"] + r["p_exam"] + r["p_viva"]
        theory = r["t_att"] + r["t_assign"] + r["t_present"] + r["t_assess"]
        table_rows.append([
            r["enrollment"], r["name"],
            str(r["p_att"]), str(r["p_lab"]), str(r["p_exam"]), str(r["p_viva"]),
            str(r["t_att"]), str(r["t_assign"]), str(r["t_present"]), str(r["t_assess"]),
            str(practical), str(theory), str(practical + theory),
        ])

    published = sum(1 for r in rows if r["status"] == "published")
    avg = round(sum(
        r["p_att"] + r["p_lab"] + r["p_exam"] + r["p_viva"] + r["t_att"] + r["t_assign"] + r["t_present"] + r["t_assess"]
        for r in rows
    ) / len(rows)) if rows else 0

    return _render(
        institution_name=institution_name,
        report_title="Internal Marks Report",
        student_info=course_info,
        summary_lines=[
            f"<b>Students:</b> {len(rows)} &nbsp;&nbsp; <b>Class average:</b> {avg}/50 "
            f"&nbsp;&nbsp; <b>Published:</b> {published}/{len(rows)}",
        ],
        sections=[("Practical (20) · Theory (30) · Total (50)", headers, table_rows, widths)],
    )


def build_semester_results_report(
    *, institution_name: str, student_info: dict[str, str],
    cgpa: float, results: list[dict], courses_by_semester: dict[int, list[dict]],
    only_semester: int | None = None,
) -> bytes:
    if only_semester is not None:
        results = [r for r in results if r["semester"] == only_semester]
        title = f"Semester {only_semester} Marksheet"
    else:
        title = "Semester Results Summary"

    total_credits = sum(r["credits"] for r in results)
    summary_lines = [
        f"<b>Cumulative CGPA:</b> {cgpa} &nbsp;&nbsp; <b>Total credits earned:</b> {total_credits}"
        + (f" &nbsp;&nbsp; <b>Semesters:</b> {len(results)}" if only_semester is None else ""),
    ]

    sections: list[tuple[str, list[str], list[list[str]], list[float] | None]] = []

    if only_semester is None:
        rows = [[f"Semester {r['semester']}", str(r["gpa"]), str(r["credits"]), r["status"]] for r in results]
        sections.append(("Semester-wise Summary", ["Semester", "GPA", "Credits", "Status"], rows, [40 * mm, 30 * mm, 30 * mm, 30 * mm]))

    for r in results:
        courses = courses_by_semester.get(r["semester"], [])
        course_rows = [[c["code"], c["name"], str(c["credits"]), c["grade"], str(c["grade_point"])] for c in courses]
        sections.append((
            f"Semester {r['semester']} — GPA {r['gpa']} ({r['status']})",
            ["Code", "Course", "Credits", "Grade", "Grade Pts"],
            course_rows,
            [22 * mm, 62 * mm, 20 * mm, 20 * mm, 22 * mm],
        ))

    return _render(
        institution_name=institution_name,
        report_title=title,
        student_info=student_info,
        summary_lines=summary_lines,
        sections=sections,
    )