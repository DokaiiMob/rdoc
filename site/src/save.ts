/** Save helpers: File System Access API with download fallback. */

export async function saveTextFile(
  filename: string,
  text: string,
  mime = "text/html;charset=utf-8",
): Promise<"picker" | "download"> {
  const w = window as Window & {
    showSaveFilePicker?: (opts: {
      suggestedName?: string;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<FileSystemFileHandle>;
  };

  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "rdoc HTML",
            accept: { "text/html": [".html", ".rdoc.html"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([text], { type: mime }));
      await writable.close();
      return "picker";
    } catch (err) {
      // User cancel — don't fall through to download
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      // Unsupported / permission — fall back
    }
  }

  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return "download";
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write(data: Blob | string | BufferSource): Promise<void>;
  close(): Promise<void>;
}
