/**
 * Helper to download files with native OS "Save As" location dialog
 * using File System Access API (showSaveFilePicker), with robust blob fallback.
 */

export async function downloadFileWithSaveDialog(url: string, suggestedName?: string): Promise<boolean> {
  try {
    // 1. Fetch file as blob
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();

    // 2. Determine appropriate filename and extension
    let filename = suggestedName || "download";
    if (!filename.includes(".") && blob.type) {
      const mimeToExt: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "application/pdf": "pdf",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/vnd.ms-excel": "xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "application/vnd.ms-powerpoint": "ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
        "application/zip": "zip"
      };
      const ext = mimeToExt[blob.type];
      if (ext) filename = `${filename}.${ext}`;
    }

    const fileExt = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() || "" : "";

    // 3. Try Native File System Access API (Supported in Chrome, Edge, Opera on Windows & Mac)
    // This explicitly triggers the Windows File Explorer "Save As" window to choose the folder location!
    if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
      try {
        const pickerOptions: any = {
          suggestedName: filename,
        };
        if (fileExt) {
          pickerOptions.types = [
            {
              description: `${fileExt.toUpperCase()} File`,
              accept: {
                [blob.type || "application/octet-stream"]: [`.${fileExt}`]
              }
            }
          ];
        }

        const handle = await (window as any).showSaveFilePicker(pickerOptions);
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (pickerErr: any) {
        // User clicked cancel / closed the file picker modal
        if (pickerErr.name === "AbortError") {
          return false;
        }
        console.warn("showSaveFilePicker failed or was not allowed, falling back to blob download", pickerErr);
      }
    }

    // 4. Fallback for Firefox, Safari, iOS, or restricted contexts:
    // Create object URL and trigger simulated click
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch (error) {
    console.error("Download error, opening file in new tab as fallback:", error);
    // Ultimate fallback if fetch was blocked by CORS
    window.open(url, "_blank");
    return false;
  }
}
