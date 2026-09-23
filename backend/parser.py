import io
import re
from typing import Tuple

def clean_extracted_text(text: str) -> str:
    """Cleans extracted resume or JD text, removing excessive whitespace while preserving section breaks."""
    # Normalize carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove null bytes
    text = text.replace("\x00", "")
    # Remove page break form feed characters
    text = text.replace("\x0c", "\n")
    # Normalize multiple blank lines to max 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip trailing and leading whitespace
    return text.strip()

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from PDF, DOCX, or TXT file bytes.
    Raises ValueError with a user-friendly message if extraction fails.
    """
    if not file_bytes:
        raise ValueError("Uploaded file is empty. Please upload a valid document.")
        
    lower_name = filename.lower()
    
    if lower_name.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_pages.append(page_text)
            full_text = "\n\n".join(extracted_pages)
            if not full_text.strip():
                raise ValueError("We couldn't extract text from this PDF. It might be a scanned image or protected document. Please upload another copy.")
            return clean_extracted_text(full_text)
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"We couldn't read this PDF file ({str(e)}). Please upload another copy.")

    elif lower_name.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            # Also extract tables if present
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        paragraphs.append(row_text)
            full_text = "\n".join(paragraphs)
            if not full_text.strip():
                raise ValueError("We couldn't extract text from this DOCX document. Please check the file contents.")
            return clean_extracted_text(full_text)
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"We couldn't read this DOCX document ({str(e)}). Please upload another copy.")

    elif lower_name.endswith(".doc"):
        # Legacy binary .doc format
        # Try extracting printable ASCII / UTF-8 strings or inform user
        try:
            # Fallback string extractor for legacy doc
            text = file_bytes.decode('latin-1', errors='ignore')
            # Extract ascii text sequences longer than 4 chars
            clean_strings = re.findall(r'[A-Za-z0-9\s.,;:\-\(\)\@\/\+\#]{4,}', text)
            joined = " ".join(clean_strings)
            if len(joined) < 100:
                raise ValueError("Legacy .DOC binary files often fail to parse cleanly. Please save your file as .DOCX or .PDF and re-upload.")
            return clean_extracted_text(joined)
        except Exception:
            raise ValueError("Legacy .DOC format is not fully supported. Please re-save as PDF or DOCX.")

    elif lower_name.endswith(".txt"):
        for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                text = file_bytes.decode(encoding)
                return clean_extracted_text(text)
            except UnicodeDecodeError:
                continue
        raise ValueError("We couldn't read this text file. Please ensure it is saved in UTF-8 encoding.")

    else:
        raise ValueError(f"Unsupported file format '{filename}'. Please upload a PDF, DOCX, or TXT file.")
