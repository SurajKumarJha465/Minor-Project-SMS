from pathlib import Path

BASE = Path("~/Loveable/eduflow-hub").expanduser()
BASE2 = Path("~/PycharmProjects/Virekto").expanduser()

FILES = [
    BASE2 / "api/routers/roster.py",
    BASE2 / "api/routers/teacher.py"

]

OUTPUT_FILE = "scraped_files.txt"

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    for path in FILES:
        out.write("=" * 100 + "\n")
        out.write(f"FILE: {path}\n")
        out.write("=" * 100 + "\n\n")

        if not path.exists():
            out.write("ERROR: File not found.\n\n")
            print(f"❌ {path}")
            continue

        print(f"✅ Reading {path}")

        try:
            out.write(path.read_text(encoding="utf-8"))
            out.write("\n\n")
        except Exception as e:
            out.write(f"ERROR: {e}\n\n")