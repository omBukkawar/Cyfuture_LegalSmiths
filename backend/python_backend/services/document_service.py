import io

try:
    from langchain.docstore.document import Document
except ImportError:
    class Document:
        def __init__(self, page_content: str, metadata: dict = None):
            self.page_content = page_content
            self.metadata = metadata or {}
        def __repr__(self):
            return f"Document(page_content='{self.page_content[:30]}...', metadata={self.metadata})"

def extract_elements_from_stream(file_stream: io.BytesIO, file_name: str) -> list[Document]:
    """Extracts text and table elements from uploaded file bytes."""
    documents = []
    
    # Try using unstructured
    try:
        from unstructured.partition.auto import partition
        file_stream.seek(0)
        elements = partition(file=file_stream, strategy="fast")

        for element in elements:
            page_num = element.metadata.page_number if hasattr(element.metadata, "page_number") else -1
            metadata = {
                "source": file_name,
                "element_type": element.category,
                "page_number": page_num,
            }
            if element.category == "Table":
                content = f"Table from page {page_num}:\n" + str(element.text)
            else:
                content = str(element.text)

            if content.strip():
                documents.append(Document(page_content=content, metadata=metadata))

        if documents:
            return documents
    except Exception as e:
        print(f"Notice: unstructured parsing failed or not available ({e}). Trying fallback...")

    # Fallback 1: Try PyPDF if PDF
    if file_name.lower().endswith(".pdf"):
        try:
            import pypdf
            file_stream.seek(0)
            reader = pypdf.PdfReader(file_stream)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    documents.append(
                        Document(
                            page_content=text,
                            metadata={"source": file_name, "element_type": "text", "page_number": idx + 1},
                        )
                    )
            if documents:
                return documents
        except Exception as pdf_err:
            print(f"Notice: PyPDF fallback failed: {pdf_err}")

    # Fallback 2: Raw text decode (for .txt, .md, etc.)
    try:
        file_stream.seek(0)
        raw_text = file_stream.read().decode("utf-8", errors="ignore")
        if raw_text.strip():
            documents.append(
                Document(
                    page_content=raw_text,
                    metadata={"source": file_name, "element_type": "raw_text", "page_number": 1},
                )
            )
    except Exception as raw_err:
        print(f"Error reading raw text: {raw_err}")

    return documents

