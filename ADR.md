# Architecture Decision Records

This document contains the Architecture Decision Records (ADRs) for the extension, which are used to document the architectural decisions made during the development process and the reasons behind them.

## ADR 001: Use of Manifest V3 for Chrome Extension

**Title:** Adopting Manifest V3 for the Chrome Extension

**Status:** Accepted

**Context:** Chrome's Manifest V3 introduces more powerful and secure APIs, and Google has indicated that V2 will be deprecated in the future.

**Decision:** Use Manifest V3 for the extension to ensure future compatibility and leverage the latest features and security measures.

**Consequences:**
- Improved security and performance.
- Need to adapt to service workers for background scripts.
- Some older APIs might not be directly compatible and would require adjustments.

---

## ADR 002: Data Extraction and Storage Format

**Title:** Storing Extracted Data in JSON Format

**Status:** Accepted

**Context:** The extension aims to extract class list data, which includes structured data like names, images, and other details.

**Decision:** Store and provide the extracted data in JSON format, which is both human-readable and easily consumed by other tools or systems.

**Consequences:**
- Easy integration with other systems.
- Human-readable format for debugging and manual checks.

---

## ADR 003: Image Encoding for Data Portability

**Title:** Encoding Images in Base64 for Portability

**Status:** Accepted

**Context:** The extension extracts student images, but direct image links might expire or require authentication.

**Decision:** Encode images in Base64 format and embed them in the JSON output. This ensures that the images are always accessible with the data.

**Consequences:**
- Increased size of the JSON output due to embedded images.
- No dependency on external image links.

---

## ADR 004: Progress Bar Implementation

**Title:** Implementing a Progress Bar for Data Extraction

**Status:** Accepted

**Context:** Users need feedback on the extraction process to understand the progress and ensure the extension is working.

**Decision:** Implement a progress bar in the popup UI that updates in real-time as data is extracted.

**Consequences:**
- Improved user experience.
- Additional messaging between content, background, and popup scripts to update progress.

---

## ADR 005: GitHub Actions for Packaging and Release

**Title:** Using GitHub Actions for Automated Packaging and Release

**Status:** Accepted

**Context:** There's a need for an automated way to package the extension and create releases, ensuring consistent builds.

**Decision:** Use GitHub Actions to automatically zip the extension's folder and create a timestamped release.

**Consequences:**
- Automated and consistent release process.
- The need to maintain the GitHub Actions workflow file.
