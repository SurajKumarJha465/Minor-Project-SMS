from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION

# Create document
doc = Document()

# Set margins (1 inch = 914400 EMU)
section = doc.sections[0]
section.top_margin = Inches(1)
section.bottom_margin = Inches(1)
section.left_margin = Inches(1)
section.right_margin = Inches(1)
section.gutter = Inches(0.5)

# Set line spacing (1.5 lines = 432 twips = 36 pts)
doc.styles['Normal'].paragraph_format.line_spacing = Pt(36)

# College Name (Arial Black, 20pt)
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run("NEPAL COLLEGE OF INFORMATION TECHNOLOGY")
run.font.name = "Arial Black"
run.font.size = Pt(20)
run.bold = True

# Report Title (16pt, Bold)
doc.add_paragraph()
title2 = doc.add_paragraph()
title2.alignment = WD_ALIGN_PARAGRAPH.CENTER
run2 = title2.add_run('"Smart Student Management System"')
run2.font.size = Pt(16)
run2.bold = True

# Save the document
doc.save("Smart_Student_Management_System_Proposal.docx")
print("Document created successfully!")