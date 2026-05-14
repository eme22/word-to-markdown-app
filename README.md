# Word to Markdown (Desktop)

A powerful desktop version of Word to Markdown built with **Tauri**. Convert your Word documents to beautiful Markdown with native performance and privacy.

## Desktop Features

- **Bulk Conversion**: Convert multiple Word documents simultaneously. Access this feature via the "Bulk Convert" window.
- **Drag & Drop Support**: Easily drop multiple files or folders into the application for instant batch processing.
- **Native Clipboard Integration**: Automatically copy the generated Markdown to your system clipboard upon successful conversion.
- **Responsive Performance**: Utilizes **Web Workers** for document conversion, ensuring the UI remains smooth and responsive even when processing large batches of files.
- **Native File Access**: Save your converted files directly to your system (e.g., Downloads folder) with proper native permissions.
- **Rich Feedback**: Integrated toast notifications and loading indicators for a premium user experience.

## Supports

- Paragraphs
- Numbered and Bullet lists (including nested)
- Headings, Tables, and Links
- Footnotes and endnotes
- Images and text boxes
- Bold, italics, underlines, strikethrough, etc.

## Why a Desktop App?

While the web version offers great privacy, the desktop app takes it further by providing:
1. **Direct File System Access**: Save converted files exactly where you want them.
2. **Offline Capability**: Works without an internet connection.
3. **Batch Processing**: Process dozens of files in seconds without browser limitations.
4. **System Integration**: Native clipboard and window management.

## Development & Running

### Prerequisites

- Node.js (>= 20.9)
- Rust (for Tauri)

### Setup

1. Clone the repo
2. Run `npm install`

### Running the Desktop App

```bash
npm run tauri dev
```

### Building for Production

```bash
npm run tauri build
```

## A note on privacy

Word to Markdown Desktop is designed with privacy as a core principle. 
- **100% Local**: All processing happens on your machine. No document content ever leaves your device.
- **No Analytics**: The desktop version contains zero tracking or telemetry.
- **Open Source**: Verify the security and privacy for yourself.

## How it works

The app uses a modular architecture shared with the core library:
1. **Mammoth.js**: Extracts clean HTML from `.docx` files.
2. **Turndown**: Converts sanitized HTML to Markdown.
3. **Markdownlint**: Polishes and validates the output.

The desktop version wraps these tools in a Tauri container, providing a native bridge for file system and clipboard operations.
