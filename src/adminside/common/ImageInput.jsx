import { useEffect, useRef, useState } from "react";
import { base_url } from "../../config/config";

/**
 * Image field that accepts either a pasted link or an uploaded file.
 * Uploading sends the file to /upload-image and fills the field with the resulting URL,
 * so the parent form always just reads a URL string.
 *
 * Uncontrolled (plain forms reading form.<name>.value): pass `name` (+ optional defaultValue).
 * Controlled: pass `value` and `onChange(url)`.
 */
const ImageInput = ({
  name,
  value,
  defaultValue = "",
  onChange,
  required = false,
  placeholder = "Paste image URL or upload",
  className = "input input-bordered w-full",
}) => {
  const controlled = value !== undefined;
  const [innerUrl, setInnerUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const textRef = useRef(null);
  const fileRef = useRef(null);

  const url = controlled ? value : innerUrl;

  const setUrl = (next) => {
    if (!controlled) setInnerUrl(next);
    onChange?.(next);
    setPreviewFailed(false);
  };

  // Keep in sync with form.reset() used by the uncontrolled forms.
  useEffect(() => {
    const form = textRef.current?.form;
    if (!form || controlled) return;
    const onReset = () => {
      setInnerUrl(defaultValue);
      setError("");
      setPreviewFailed(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [controlled, defaultValue]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch(`${base_url}/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.path) throw new Error(data.message || "Upload failed");
      setUrl(`${base_url}${data.path}`);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <input
          ref={textRef}
          type="text"
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`${className} flex-1 min-w-0`}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn btn-outline shrink-0"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {url && !previewFailed && (
        <div className="flex items-center gap-2">
          <img
            src={url}
            alt="Preview"
            onError={() => setPreviewFailed(true)}
            className="h-14 w-14 object-contain rounded border bg-gray-50"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-xs text-gray-500 hover:text-red-500"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageInput;
