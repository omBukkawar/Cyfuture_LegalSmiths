import re
import difflib
from typing import List, Dict, Tuple, Optional, Any


def extract_actual_contract_sections(full_text: str) -> List[Dict[str, Any]]:
    """
    Scans the contract text and extracts the REAL section numbers and titles.
    e.g. Section 1 (Definitions), Section 12 (Indemnification), Section 13 (Limitation of Liability).
    """
    sections = []
    # Pattern to match:
    # 'Section 12. Indemnification' or '12. Indemnification' or 'Clause 12: Indemnification' or 'Article 12 - Indemnification'
    patterns = [
        re.compile(r"^(?:Section|Article|Clause)\s+([0-9A-Za-z\.\-]+)[\.\:\-\s]+([^\n\r]{3,80})", re.MULTILINE | re.IGNORECASE),
        re.compile(r"^([0-9]{1,3}\.[0-9]{0,2})[\.\:\-\s]+([A-Za-z][^\n\r]{3,80})", re.MULTILINE),
        re.compile(r"^([A-Z\s]{4,40})\n(?=[A-Z0-9])", re.MULTILINE)
    ]

    seen_numbers = set()
    for pattern in patterns:
        for match in pattern.finditer(full_text):
            if len(match.groups()) == 2:
                num = match.group(1).strip()
                title = match.group(2).strip()
            else:
                num = ""
                title = match.group(1).strip()

            clean_key = f"{num} {title}".lower()
            if clean_key not in seen_numbers and len(title) > 2:
                seen_numbers.add(clean_key)
                sections.append({
                    "number": num,
                    "title": title,
                    "full_label": f"Section {num}: {title}" if num else title,
                    "start_pos": match.start()
                })

    sections.sort(key=lambda s: s["start_pos"])
    return sections


def generate_section_directory_text(sections: List[Dict[str, Any]]) -> str:
    """Formats sections into a clear directory string for the LLM prompt."""
    if not sections:
        return "No explicit numbered section headings detected. Cite exact headings or clause titles found in text."

    lines = ["ACTUAL CONTRACT SECTION DIRECTORY (You MUST cite ONLY these real section numbers & titles):"]
    for s in sections[:45]:
        lines.append(f"• {s['full_label']}")
    return "\n".join(lines)


def normalize_for_matching(text: str) -> str:
    """Normalizes text for robust fuzzy substring matching."""
    text = text.lower()
    text = re.sub(r'[\u2018\u2019\u201c\u201d\'"“”]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def verify_and_ground_quote(claimed_quote: str, full_contract_text: str) -> Tuple[bool, str]:
    """
    GROUNDING ENGINE: Verifies whether an evidence quote exists in the contract text.
    If exact match or fuzzy match is found, returns (True, verbatim_quote_from_contract).
    If fabricated/hallucinated, returns (False, claimed_quote).
    """
    if not claimed_quote or not claimed_quote.strip():
        return False, ""

    cleaned_quote = claimed_quote.strip().strip('"\'“”')
    if len(cleaned_quote) < 10:
        return False, cleaned_quote

    # 1. Exact Substring Search
    if cleaned_quote in full_contract_text:
        return True, cleaned_quote

    # 2. Normalized Whitespace & Punctuation Search
    norm_doc = normalize_for_matching(full_contract_text)
    norm_quote = normalize_for_matching(cleaned_quote)

    if norm_quote in norm_doc:
        # Locate the exact casing in the original document
        start_idx = norm_doc.find(norm_quote)
        # Find rough slice in original text
        words = cleaned_quote.split()
        if len(words) >= 3:
            first_words = " ".join(words[:3])
            last_words = " ".join(words[-3:])
            p1 = full_contract_text.lower().find(first_words.lower())
            p2 = full_contract_text.lower().find(last_words.lower(), p1 if p1 != -1 else 0)
            if p1 != -1 and p2 != -1 and (p2 - p1) < len(cleaned_quote) * 2:
                verbatim_slice = full_contract_text[p1 : p2 + len(last_words)].strip()
                return True, verbatim_slice

    # 3. Sentence-level Substring / Overlap Search (Handles slight line-wrap discrepancies)
    sentences = re.split(r'(?<=[.!?])\s+', full_contract_text)
    best_ratio = 0.0
    best_sentence = ""

    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 15:
            continue
        # Check if 75%+ of the quote words are present in sequence
        norm_s = normalize_for_matching(s_clean)
        matcher = difflib.SequenceMatcher(None, norm_quote, norm_s)
        match = matcher.find_longest_match(0, len(norm_quote), 0, len(norm_s))
        if match.size > 25:
            overlap_ratio = match.size / len(norm_quote)
            if overlap_ratio > best_ratio:
                best_ratio = overlap_ratio
                best_sentence = s_clean

    if best_ratio >= 0.70:
        return True, best_sentence

    # Quote is not grounded in the actual document
    return False, cleaned_quote


def correct_clause_reference(claimed_ref: str, finding_title: str, evidence: str, sections: List[Dict[str, Any]], full_text: str) -> str:
    """
    CLAUSE MAPPING CORRECTION:
    Ensures the clause reference accurately reflects the real document section.
    E.g., if LLM said Section 18 for Indemnity, but Indemnity is in Section 12, corrects it.
    """
    if not sections:
        return claimed_ref

    combined_context = f"{claimed_ref} {finding_title} {evidence}".lower()

    # Topic mapping heuristics:
    topics = {
        "indemnif": "indemnif",
        "liabilit": "liabilit",
        "sla": "sla|service level|uptime",
        "terminat": "terminat",
        "payment": "payment|fee|invoice",
        "intellectual property": "intellectual property|ip|proprietary",
        "subcontract": "subcontract|delegat",
        "warranty": "warrant",
        "dispute": "dispute|arbitrat|jurisdiction|governing law",
        "confidential": "confidential"
    }

    matched_topic_key = None
    for k, v in topics.items():
        if re.search(v, combined_context):
            matched_topic_key = v
            break

    if matched_topic_key:
        matching_real_sections = []
        for s in sections:
            if re.search(matched_topic_key, s["title"].lower()):
                matching_real_sections.append(s["full_label"])

        if matching_real_sections:
            # Check if claimed_ref already contains one of the real section numbers
            for real_sec in matching_real_sections:
                # Extract number
                m = re.search(r'\d+', real_sec)
                if m and m.group(0) in claimed_ref:
                    return claimed_ref # Already points to real section

            # Correct to the real section!
            return " & ".join(matching_real_sections)

    return claimed_ref

