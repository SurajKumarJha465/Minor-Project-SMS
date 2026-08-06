#!/usr/bin/env python3
"""
extract_code.py

Walks a project directory and dumps every relevant source file's path + content
into a single markdown file, so it can be pasted into a chat for full context.

Usage:
    python extract_code.py /path/to/project [-o output.md] [--exclude-ui] [--max-kb 300]

Examples:
    # Backend (Virekto)
    python extract_code.py . -o virekto_dump.md

    # Frontend (eduflow-hub), skipping the boilerplate shadcn/ui primitives
    python extract_code.py ~/Loveable/eduflow-hub -o eduflow_dump.md --exclude-ui
"""

import argparse
import os
import sys

# Directories to never descend into
EXCLUDE_DIRS = {
    "__pycache__", "node_modules", ".git", ".venv", "venv", "env",
    "dist", "build", ".next", ".turbo", ".cache", ".idea", ".vscode",
    "attendance_logs", "debug", "models", "asset", ".pytest_cache",
    "coverage", ".ruff_cache",
}

# File extensions we actually want the content of
INCLUDE_EXTS = {
    ".py", ".pyi",
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".json", ".toml", ".yaml", ".yml", ".env.example",
    ".css", ".scss",
    ".md",
    ".html",
    ".sql",
    ".sh",
}

# Specific filenames worth including even without a "normal" ext match
INCLUDE_FILENAMES = {
    "Dockerfile", "AGENTS.md", "README.md", "package.json", "pyproject.toml",
    "vite.config.ts", "tsconfig.json", "eslint.config.js", "components.json",
    "bunfig.toml",
}

# Never include these regardless of extension (binaries, locks, generated junk)
EXCLUDE_FILENAMES = {
    "uv.lock", "bun.lock", "package-lock.json", "yarn.lock",
    "known_embeddings.pkl", "routeTree.gen.ts",
}
EXCLUDE_EXTS = {
    ".pyc", ".pt", ".pkl", ".jpg", ".jpeg", ".png", ".ico", ".gif",
    ".woff", ".woff2", ".ttf", ".svg",
}

# Optional: shadcn/ui primitive components are boilerplate and rarely need
# to be re-read for integration work. Skip with --exclude-ui.
UI_BOILERPLATE_DIR = os.path.join("components", "ui")


def should_skip_dir(dirname, path, exclude_ui):
    if dirname in EXCLUDE_DIRS:
        return True
    if exclude_ui and UI_BOILERPLATE_DIR in path.replace("\\", "/").replace("/", os.sep):
        return True
    return False


def should_include_file(filename, exclude_ui, current_path):
    if filename in EXCLUDE_FILENAMES:
        return False
    ext = os.path.splitext(filename)[1]
    if ext in EXCLUDE_EXTS:
        return False
    if exclude_ui and (os.sep + UI_BOILERPLATE_DIR + os.sep) in (current_path + os.sep):
        return False
    if filename in INCLUDE_FILENAMES:
        return True
    return ext in INCLUDE_EXTS


def lang_for_ext(ext):
    return {
        ".py": "python", ".pyi": "python",
        ".ts": "ts", ".tsx": "tsx", ".js": "js", ".jsx": "jsx",
        ".mjs": "js", ".cjs": "js",
        ".json": "json", ".toml": "toml", ".yaml": "yaml", ".yml": "yaml",
        ".css": "css", ".scss": "scss",
        ".md": "md", ".html": "html", ".sql": "sql", ".sh": "bash",
    }.get(ext, "")


def main():
    ap = argparse.ArgumentParser(description="Dump project source into one markdown file.")
    ap.add_argument("root", help="Path to project root")
    ap.add_argument("-o", "--out", default="code_dump.md", help="Output markdown file")
    ap.add_argument("--exclude-ui", action="store_true",
                     help="Skip components/ui/* boilerplate (shadcn primitives)")
    ap.add_argument("--max-kb", type=int, default=300,
                     help="Skip individual files larger than this many KB (default 300)")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print(f"Not a directory: {root}", file=sys.stderr)
        sys.exit(1)

    included = []
    skipped_large = []

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d for d in dirnames
            if not should_skip_dir(d, os.path.join(dirpath, d), args.exclude_ui)
        ]
        for fname in sorted(filenames):
            full = os.path.join(dirpath, fname)
            if not should_include_file(fname, args.exclude_ui, dirpath):
                continue
            size_kb = os.path.getsize(full) / 1024
            if size_kb > args.max_kb:
                skipped_large.append((full, size_kb))
                continue
            included.append(full)

    with open(args.out, "w", encoding="utf-8") as out:
        out.write(f"# Code dump: {root}\n\n")
        out.write(f"Files included: {len(included)}\n\n")
        out.write("## File tree\n\n```\n")
        for f in included:
            out.write(os.path.relpath(f, root).replace("\\", "/") + "\n")
        out.write("```\n\n---\n\n")

        for f in included:
            rel = os.path.relpath(f, root).replace("\\", "/")
            ext = os.path.splitext(f)[1]
            lang = lang_for_ext(ext)
            out.write(f"## `{rel}`\n\n")
            try:
                with open(f, "r", encoding="utf-8", errors="replace") as fh:
                    content = fh.read()
            except Exception as e:
                out.write(f"_Could not read file: {e}_\n\n")
                continue
            out.write(f"```{lang}\n{content}\n```\n\n")

    print(f"Wrote {len(included)} files -> {args.out}")
    if skipped_large:
        print(f"Skipped {len(skipped_large)} large file(s) (> {args.max_kb} KB):")
        for f, kb in skipped_large:
            print(f"  - {os.path.relpath(f, root)} ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
