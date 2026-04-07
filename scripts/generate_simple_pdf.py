from __future__ import annotations

import sys
import textwrap
import unicodedata
from pathlib import Path


PAGE_WIDTH = 595
PAGE_HEIGHT = 842
MARGIN_X = 48
MARGIN_TOP = 48
MARGIN_BOTTOM = 48
FONT_SIZE = 10
LEADING = 14
MAX_CHARS = 96


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_text.replace("\t", "    ")


def wrap_markdown(text: str) -> list[str]:
    lines: list[str] = []
    for raw in text.splitlines():
        line = normalize_text(raw.rstrip())

        if not line:
            lines.append("")
            continue

        if line.startswith("#"):
            heading = line.lstrip("#").strip().upper()
            lines.append(heading)
            lines.append("")
            continue

        if line.startswith("- "):
            wrapped = textwrap.wrap(
                line[2:],
                width=MAX_CHARS - 2,
                break_long_words=False,
                break_on_hyphens=False,
            )
            if wrapped:
                lines.append(f"- {wrapped[0]}")
                for part in wrapped[1:]:
                    lines.append(f"  {part}")
            else:
                lines.append("-")
            continue

        if line[:2].isdigit() and line[1:3] == ". ":
            wrapped = textwrap.wrap(
                line[3:],
                width=MAX_CHARS - 3,
                break_long_words=False,
                break_on_hyphens=False,
            )
            prefix = line[:3]
            if wrapped:
                lines.append(f"{prefix}{wrapped[0]}")
                for part in wrapped[1:]:
                    lines.append(" " * len(prefix) + part)
            else:
                lines.append(prefix.strip())
            continue

        wrapped = textwrap.wrap(
            line,
            width=MAX_CHARS,
            break_long_words=False,
            break_on_hyphens=False,
        )
        lines.extend(wrapped or [""])
    return lines


def paginate(lines: list[str]) -> list[list[str]]:
    usable_height = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM
    lines_per_page = usable_height // LEADING
    return [lines[i:i + lines_per_page] for i in range(0, len(lines), lines_per_page)] or [[]]


def escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_page_stream(page_lines: list[str], page_number: int, page_count: int) -> bytes:
    commands: list[str] = []
    y = PAGE_HEIGHT - MARGIN_TOP

    commands.append("BT")
    commands.append(f"/F1 {FONT_SIZE} Tf")
    commands.append("0 g")

    for line in page_lines:
        safe = escape_pdf_text(line)
        commands.append(f"1 0 0 1 {MARGIN_X} {y} Tm ({safe}) Tj")
        y -= LEADING

    footer = f"Pagina {page_number} de {page_count}"
    commands.append(f"1 0 0 1 {PAGE_WIDTH - MARGIN_X - 70} {MARGIN_BOTTOM - 10} Tm ({escape_pdf_text(footer)}) Tj")
    commands.append("ET")
    return "\n".join(commands).encode("latin-1", "replace")


def build_pdf(pages: list[list[str]]) -> bytes:
    objects: list[bytes] = []

    def add_object(data: bytes) -> int:
        objects.append(data)
        return len(objects)

    font_id = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    content_ids: list[int] = []
    page_ids: list[int] = []
    page_count = len(pages)

    for index, page_lines in enumerate(pages, start=1):
        stream = build_page_stream(page_lines, index, page_count)
        stream_obj = (
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1")
            + stream
            + b"\nendstream"
        )
        content_ids.append(add_object(stream_obj))
        page_ids.append(0)

    pages_id_placeholder = add_object(b"")

    for i, content_id in enumerate(content_ids):
        page_obj = (
            f"<< /Type /Page /Parent {pages_id_placeholder} 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        ).encode("latin-1")
        page_ids[i] = add_object(page_obj)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id_placeholder - 1] = f"<< /Type /Pages /Count {len(page_ids)} /Kids [{kids}] >>".encode("latin-1")
    catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id_placeholder} 0 R >>".encode("latin-1"))

    output = bytearray()
    output.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("latin-1"))
        output.extend(obj)
        output.extend(b"\nendobj\n")

    xref_start = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    trailer = (
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref_start}\n%%EOF\n"
    )
    output.extend(trailer.encode("latin-1"))
    return bytes(output)


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python scripts/generate_simple_pdf.py <input.txt|md> <output.pdf>")
        return 1

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])

    text = source.read_text(encoding="utf-8")
    lines = wrap_markdown(text)
    pages = paginate(lines)
    pdf_data = build_pdf(pages)

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(pdf_data)
    print(f"PDF generated: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
