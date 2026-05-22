#!/usr/bin/env python3
"""Extract design tokens from src/style.css → design-system-audit.txt."""

import re
from collections import Counter
from pathlib import Path

SRC = Path(__file__).parent / "src" / "style.css"
OUT = Path(__file__).parent / "design-system-audit.txt"

css = SRC.read_text()


def root_vars(text: str) -> list[tuple[str, str]]:
    """Return [(name, value), ...] for every `--var: value;` declared inside :root { ... }."""
    pairs = []
    for m in re.finditer(r":root\s*\{([^}]*)\}", text, re.DOTALL):
        block = m.group(1)
        for line in block.splitlines():
            line = line.strip()
            if line.startswith("--"):
                vm = re.match(r"(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);", line)
                if vm:
                    pairs.append((vm.group(1), vm.group(2).strip()))
    return pairs


def find_colors(text: str) -> Counter:
    """Count every hex color, rgb(), and rgba() literal."""
    counts: Counter = Counter()
    # Hex: 3, 4, 6, or 8 hex digits. Anchored with non-word lookbehind/ahead so we don't
    # grab partial hashes inside ids/comments.
    for m in re.finditer(r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b", text):
        counts[m.group(0).lower()] += 1
    # rgb() / rgba()
    for m in re.finditer(r"rgba?\([^)]*\)", text):
        # Normalize whitespace inside parens for deduplication.
        normalized = re.sub(r"\s+", " ", m.group(0))
        normalized = re.sub(r"\(\s+", "(", normalized)
        normalized = re.sub(r"\s+\)", ")", normalized)
        normalized = re.sub(r"\s*,\s*", ", ", normalized)
        counts[normalized] += 1
    return counts


def find_values(text: str, prop: str) -> Counter:
    """Count every distinct value of `prop: ...;` declarations (excluding `prop-*:`)."""
    counts: Counter = Counter()
    # Negative lookbehind to ensure we don't match e.g. `padding-top:` when prop is `padding`.
    pattern = rf"(?<![A-Za-z-]){re.escape(prop)}\s*:\s*([^;]+);"
    for m in re.finditer(pattern, text):
        val = re.sub(r"\s+", " ", m.group(1).strip())
        counts[val] += 1
    return counts


def find_side_values(text: str, base: str) -> Counter:
    """Count every distinct value across `{base}-top|right|bottom|left: ...;`."""
    counts: Counter = Counter()
    pattern = rf"(?<![A-Za-z-]){re.escape(base)}-(?:top|right|bottom|left)\s*:\s*([^;]+);"
    for m in re.finditer(pattern, text):
        val = re.sub(r"\s+", " ", m.group(1).strip())
        counts[val] += 1
    return counts


def format_section(title: str, counts: Counter) -> str:
    lines = [f"## {title}", f"({len(counts)} unique values, {sum(counts.values())} occurrences)", ""]
    if not counts:
        lines.append("(none)")
        lines.append("")
        return "\n".join(lines)
    # Sort: descending by count, then alphabetical by value.
    for val, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        lines.append(f"  {n:>4}×  {val}")
    lines.append("")
    return "\n".join(lines)


def format_vars(pairs: list[tuple[str, str]]) -> str:
    lines = [f"## CSS Variable Definitions (:root)", f"({len(pairs)} declarations)", ""]
    if not pairs:
        lines.append("(none)")
        lines.append("")
        return "\n".join(lines)
    name_col = max(len(n) for n, _ in pairs)
    for name, val in pairs:
        lines.append(f"  {name.ljust(name_col)}  {val}")
    lines.append("")
    return "\n".join(lines)


# Gather all sections.
sections: list[str] = []
sections.append("# Design system audit — src/style.css")
sections.append(f"# Generated from {SRC.name}; {len(css.splitlines())} lines, {len(css)} bytes.")
sections.append("")

sections.append(format_vars(root_vars(css)))
sections.append(format_section("Hardcoded Colors (hex / rgb / rgba)", find_colors(css)))
sections.append(format_section("Font Sizes", find_values(css, "font-size")))
sections.append(format_section("Font Weights", find_values(css, "font-weight")))
sections.append(format_section("Border Radius", find_values(css, "border-radius")))

# Spacing — split into 4 sub-buckets.
spacing_block = []
spacing_block.append("## Spacing — padding / margin")
spacing_block.append("(shorthand and single-side reported separately)")
spacing_block.append("")
spacing_block.append(format_section("Padding (shorthand `padding:`)", find_values(css, "padding")))
spacing_block.append(format_section("Padding (single-side `padding-top|right|bottom|left:`)", find_side_values(css, "padding")))
spacing_block.append(format_section("Margin (shorthand `margin:`)", find_values(css, "margin")))
spacing_block.append(format_section("Margin (single-side `margin-top|right|bottom|left:`)", find_side_values(css, "margin")))
sections.append("\n".join(spacing_block))

sections.append(format_section("Box Shadow", find_values(css, "box-shadow")))
sections.append(format_section("Z-Index", find_values(css, "z-index")))

OUT.write_text("\n".join(sections))
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
