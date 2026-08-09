#!/usr/bin/env python3

from pathlib import Path
import argparse

# File extensions that should be treated as source/config code.
CODE_EXTENSIONS = {
    # Python
    ".py",
    ".pyi",

    # JavaScript / TypeScript
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",

    # Web
    ".html",
    ".css",
    ".scss",
    ".sass",

    # Data / configuration
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".env",

    # Shell
    ".sh",
    ".bash",
    ".zsh",
    ".fish",

    # Database / queries
    ".sql",

    # Docker
    ".dockerfile",

    # Other common code
    ".java",
    ".c",
    ".h",
    ".cpp",
    ".hpp",
    ".rs",
    ".go",
    ".php",
    ".rb",
    ".swift",
    ".kt",
    ".kts",

    # Documentation that may contain useful project code/config
    ".md",
}

# Files/directories we don't want to crawl.
IGNORED_DIRS = {
    ".git",
    ".github",
    ".idea",
    ".vscode",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "node_modules",
    "venv",
    ".venv",
    "env",
    ".env",
    "dist",
    "build",
    ".next",
    "coverage",
}

# Files that are usually generated/huge and aren't useful
# when collecting the actual source.
IGNORED_FILES = {
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "uv.lock",
}


def is_code_file(path: Path) -> bool:
    """Return True if the file looks like a source/config file."""
    if path.name in IGNORED_FILES:
        return False

    if path.name == "Dockerfile":
        return True

    return path.suffix.lower() in CODE_EXTENSIONS


def should_ignore(path: Path) -> bool:
    """Return True if any part of the path belongs to an ignored directory."""
    return any(part in IGNORED_DIRS for part in path.parts)


def extract_repository(repo_path: Path, output_file: Path):
    files = []

    for path in repo_path.rglob("*"):
        if not path.is_file():
            continue

        if should_ignore(path):
            continue

        if not is_code_file(path):
            continue

        files.append(path)

    files.sort()

    print(f"Found {len(files)} code files.")

    with output_file.open("w", encoding="utf-8") as output:
        output.write("=" * 100 + "\n")
        output.write("REPOSITORY CODE EXPORT\n")
        output.write("=" * 100 + "\n")
        output.write(f"Repository: {repo_path.resolve()}\n")
        output.write(f"Files: {len(files)}\n")
        output.write("=" * 100 + "\n\n")

        for index, path in enumerate(files, start=1):
            relative_path = path.relative_to(repo_path)

            print(f"[{index}/{len(files)}] {relative_path}")

            output.write("\n")
            output.write("=" * 100 + "\n")
            output.write(f"FILE: {relative_path}\n")
            output.write("=" * 100 + "\n\n")

            try:
                content = path.read_text(
                    encoding="utf-8",
                    errors="replace",
                )
                output.write(content)
            except Exception as exc:
                output.write(
                    f"\n[ERROR READING FILE: {exc}]\n"
                )

            output.write("\n\n")

    print()
    print(f"Done.")
    print(f"Exported to: {output_file.resolve()}")


def main():
    parser = argparse.ArgumentParser(
        description="Extract source code from an entire repository."
    )

    parser.add_argument(
        "repo",
        nargs="?",
        default=".",
        help="Path to repository (default: current directory)",
    )

    parser.add_argument(
        "-o",
        "--output",
        default="repository_code.txt",
        help="Output file name",
    )

    args = parser.parse_args()

    repo_path = Path(args.repo).resolve()
    output_file = Path(args.output).resolve()

    if not repo_path.exists():
        raise SystemExit(f"Repository does not exist: {repo_path}")

    if not repo_path.is_dir():
        raise SystemExit(f"Not a directory: {repo_path}")

    extract_repository(repo_path, output_file)


if __name__ == "__main__":
    main()