import { useRef, useEffect, useState } from "react";

const RichTextEditor = ({ value = "", onChange, placeholder = "Write your task description here..." }) => {
  const iframeRef = useRef(null);
  const imageInputRef = useRef(null);
  const [activeBlock, setActiveBlock] = useState("p");
  const [fontSize, setFontSize] = useState("3");
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, strikeThrough: false,
    insertUnorderedList: false, insertOrderedList: false,
    justifyLeft: false, justifyCenter: false, justifyRight: false,
  });

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: sans-serif;
              font-size: 14px;
              color: #1f2937;
              padding: 12px 16px;
              min-height: 220px;
              outline: none;
              line-height: 1.6;
              word-break: break-word;
            }
            body:empty:before {
              content: attr(data-placeholder);
              color: #9ca3af;
              pointer-events: none;
            }
            blockquote {
              border-left: 3px solid #3b82f6;
              padding-left: 12px;
              color: #6b7280;
              margin: 4px 0;
            }
            a { color: #3b82f6; }
            ul, ol { padding-left: 20px; }
            img {
              max-width: 100%;
              display: inline-block;
              cursor: default;
            }
            .img-selected {
              outline: 2px solid #3b82f6;
              outline-offset: 1px;
            }
            .resize-overlay {
              position: fixed;
              pointer-events: none;
              z-index: 9999;
              border: 2px solid #3b82f6;
              box-sizing: border-box;
            }
            .resize-handle {
              position: fixed;
              width: 10px;
              height: 10px;
              background: #3b82f6;
              border: 2px solid white;
              border-radius: 2px;
              z-index: 10000;
              pointer-events: all;
            }
          </style>
        </head>
        <body data-placeholder="${placeholder}" contenteditable="true">${value}</body>
      </html>
    `);
    doc.close();
    doc.designMode = "on";

    // ── Inject resize logic after doc is ready ────────────────────────────
    const injectResizer = () => {
      const win = iframe.contentWindow;
      const d   = iframe.contentDocument;
      if (!win || !d) return;

      // State
      let selImg       = null;
      let overlay      = null;
      let handles      = {};
      let resizing     = false;
      let activeHandle = null;
      let startX, startY, startW, startH, startLeft, startTop;

      function removeOverlay() {
        if (overlay)  { overlay.remove();  overlay  = null; }
        Object.values(handles).forEach(h => h.remove());
        handles = {};
        if (selImg) selImg.classList.remove("img-selected");
        selImg = null;
      }

      function buildOverlay(img) {
        removeOverlay();
        selImg = img;
        img.classList.add("img-selected");

        const r = img.getBoundingClientRect();

        overlay = d.createElement("div");
        overlay.className = "resize-overlay";
        overlay.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
        d.body.appendChild(overlay);

        const positions = {
          nw: { left: r.left - 5,           top: r.top - 5            },
          ne: { left: r.left + r.width - 5,  top: r.top - 5            },
          sw: { left: r.left - 5,            top: r.top + r.height - 5 },
          se: { left: r.left + r.width - 5,  top: r.top + r.height - 5 },
        };

        const cursors = { nw: "nw-resize", ne: "ne-resize", sw: "sw-resize", se: "se-resize" };

        Object.entries(positions).forEach(([pos, coords]) => {
          const h = d.createElement("div");
          h.className = "resize-handle";
          h.style.cssText = `left:${coords.left}px;top:${coords.top}px;cursor:${cursors[pos]};`;
          d.body.appendChild(h);
          handles[pos] = h;

          h.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            resizing     = true;
            activeHandle = pos;
            startX       = e.clientX;
            startY       = e.clientY;
            startW       = img.offsetWidth;
            startH       = img.offsetHeight;
            const imgR   = img.getBoundingClientRect();
            startLeft    = imgR.left;
            startTop     = imgR.top;
          });
        });
      }

      function updateOverlay() {
        if (!selImg || !overlay) return;
        const r = selImg.getBoundingClientRect();
        overlay.style.left   = r.left   + "px";
        overlay.style.top    = r.top    + "px";
        overlay.style.width  = r.width  + "px";
        overlay.style.height = r.height + "px";

        const positions = {
          nw: { left: r.left - 5,           top: r.top - 5            },
          ne: { left: r.left + r.width - 5,  top: r.top - 5            },
          sw: { left: r.left - 5,            top: r.top + r.height - 5 },
          se: { left: r.left + r.width - 5,  top: r.top + r.height - 5 },
        };
        Object.entries(positions).forEach(([pos, coords]) => {
          if (handles[pos]) {
            handles[pos].style.left = coords.left + "px";
            handles[pos].style.top  = coords.top  + "px";
          }
        });
      }

      // Click image → show handles
      d.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "IMG") {
          e.preventDefault();
          buildOverlay(e.target);
        } else if (!e.target.classList.contains("resize-handle")) {
          removeOverlay();
        }
      });

      // Drag to resize
      d.addEventListener("mousemove", (e) => {
        if (!resizing || !selImg) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newW = startW;
        let newH = startH;

        if (activeHandle === "se") { newW = startW + dx; newH = startH + dy; }
        if (activeHandle === "sw") { newW = startW - dx; newH = startH + dy; }
        if (activeHandle === "ne") { newW = startW + dx; newH = startH - dy; }
        if (activeHandle === "nw") { newW = startW - dx; newH = startH - dy; }

        if (newW > 20) { selImg.width  = Math.round(newW); }
        if (newH > 20) { selImg.height = Math.round(newH); }

        updateOverlay();
      });

      d.addEventListener("mouseup", () => {
        if (resizing) {
          resizing = false;
          activeHandle = null;
          updateOverlay();
          // Notify parent of HTML change
          d.body.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      // Scroll → reposition overlay
      d.addEventListener("scroll", updateOverlay);
    };

    // Wait for iframe to fully load before injecting
    iframe.onload = injectResizer;
    // Also try immediately in case already loaded
    setTimeout(injectResizer, 100);

    // ── Toolbar sync ─────────────────────────────────────────────────────
    const syncToolbar = () => {
      const sel = doc.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      let node = sel.anchorNode;
      while (node && node !== doc.body) {
        const tag = node.nodeName?.toLowerCase();
        if (["h1","h2","h3","h4","p","blockquote"].includes(tag)) {
          setActiveBlock(tag); break;
        }
        if (node.parentNode === doc.body) { setActiveBlock("p"); break; }
        node = node.parentNode;
      }
      const fs = doc.queryCommandValue("fontSize");
      if (fs) setFontSize(fs);
      setActiveFormats({
        bold:                doc.queryCommandState("bold"),
        italic:              doc.queryCommandState("italic"),
        underline:           doc.queryCommandState("underline"),
        strikeThrough:       doc.queryCommandState("strikeThrough"),
        insertUnorderedList: doc.queryCommandState("insertUnorderedList"),
        insertOrderedList:   doc.queryCommandState("insertOrderedList"),
        justifyLeft:         doc.queryCommandState("justifyLeft"),
        justifyCenter:       doc.queryCommandState("justifyCenter"),
        justifyRight:        doc.queryCommandState("justifyRight"),
      });
    };

    const notifyChange = () => {
      if (onChange) onChange(doc.body.innerHTML);
      syncToolbar();
    };

    doc.body.addEventListener("input", notifyChange);
    doc.body.addEventListener("keyup", syncToolbar);
    doc.body.addEventListener("mouseup", syncToolbar);
    doc.addEventListener("selectionchange", syncToolbar);

    return () => {
      doc.body.removeEventListener("input", notifyChange);
      doc.body.removeEventListener("keyup", syncToolbar);
      doc.body.removeEventListener("mouseup", syncToolbar);
      doc.removeEventListener("selectionchange", syncToolbar);
    };
  }, []);

  const exec = (command, val = null) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    iframeRef.current.contentWindow.focus();
    doc.execCommand(command, false, val);
    if (onChange) onChange(doc.body.innerHTML);
    setActiveFormats(prev => ({ ...prev, [command]: doc.queryCommandState(command) }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => insertImageIntoEditor(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertImageIntoEditor = (src) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    iframeRef.current.contentWindow.focus();

    const img = doc.createElement("img");
    img.src   = src;
    img.width = 300;
    img.style.maxWidth = "100%";

    const sel = doc.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      doc.body.appendChild(img);
    }

    if (onChange) onChange(doc.body.innerHTML);
  };

  const insertImageFromURL = () => {
    const url = prompt("Enter image URL:", "https://");
    if (url) insertImageIntoEditor(url);
  };

  const handleHeading  = (e) => { setActiveBlock(e.target.value); exec("formatBlock", e.target.value); };
  const handleFontSize = (e) => { setFontSize(e.target.value);    exec("fontSize",    e.target.value); };
  const insertLink     = ()  => { const url = prompt("Enter URL:", "https://"); if (url) exec("createLink", url); };

  const Btn = ({ cmd, val, title, children }) => (
    <button type="button" title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
      className={`px-2 py-1 rounded text-sm transition-colors ${
        activeFormats[cmd]
          ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
          : "hover:bg-gray-200 text-gray-700"
      }`}>
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-5 bg-gray-300 mx-0.5 self-center flex-shrink-0" />;

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">

        <select value={activeBlock} onChange={handleHeading}
          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-blue-300 h-7">
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Blockquote</option>
        </select>

        <Sep />

        <select value={fontSize} onChange={handleFontSize}
          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-blue-300 h-7">
          <option value="1">Small</option>
          <option value="2">Normal</option>
          <option value="3">Medium</option>
          <option value="4">Large</option>
          <option value="5">X-Large</option>
        </select>

        <Sep />

        <Btn cmd="bold"          title="Bold">        <b className="font-bold">B</b></Btn>
        <Btn cmd="italic"        title="Italic">       <i>I</i></Btn>
        <Btn cmd="underline"     title="Underline">    <u>U</u></Btn>
        <Btn cmd="strikeThrough" title="Strikethrough"><s>S</s></Btn>

        <Sep />

        <Btn cmd="insertUnorderedList" title="Bullet List">
          <span className="flex flex-col gap-0.5 w-4">
            {[0,1,2].map(i => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-current inline-block"/>
                <span className="w-3 h-0.5 bg-current inline-block"/>
              </span>
            ))}
          </span>
        </Btn>

        <Btn cmd="insertOrderedList" title="Numbered List">
          <span className="flex flex-col gap-0.5 w-4 text-[9px] leading-none">
            {[1,2,3].map(n => (
              <span key={n} className="flex items-center gap-1">
                {n}<span className="w-3 h-0.5 bg-current inline-block"/>
              </span>
            ))}
          </span>
        </Btn>

        <Sep />

        <Btn cmd="justifyLeft" title="Align Left">
          <span className="flex flex-col gap-0.5 w-4">
            <span className="w-4 h-0.5 bg-current block"/>
            <span className="w-3 h-0.5 bg-current block"/>
            <span className="w-4 h-0.5 bg-current block"/>
          </span>
        </Btn>
        <Btn cmd="justifyCenter" title="Center">
          <span className="flex flex-col gap-0.5 w-4 items-center">
            <span className="w-4 h-0.5 bg-current block"/>
            <span className="w-2 h-0.5 bg-current block"/>
            <span className="w-4 h-0.5 bg-current block"/>
          </span>
        </Btn>
        <Btn cmd="justifyRight" title="Align Right">
          <span className="flex flex-col gap-0.5 w-4 items-end">
            <span className="w-4 h-0.5 bg-current block"/>
            <span className="w-3 h-0.5 bg-current block"/>
            <span className="w-4 h-0.5 bg-current block"/>
          </span>
        </Btn>

        <Sep />

        <Btn cmd="indent"  title="Indent"> <span className="text-xs font-mono">→</span></Btn>
        <Btn cmd="outdent" title="Outdent"><span className="text-xs font-mono">←</span></Btn>

        <Sep />

        <button type="button" title="Insert Link"
          onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
          className="px-2 py-1 rounded text-sm hover:bg-gray-200 text-gray-700 transition-colors">
          🔗
        </button>

        <Sep />

        {/* Image upload */}
        <button type="button" title="Upload image"
          onMouseDown={(e) => { e.preventDefault(); imageInputRef.current.click(); }}
          className="px-2 py-1 rounded text-sm hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="10" rx="1.5"/>
            <path d="M1 10l3.5-3.5 3 3 2.5-2.5L14 11"/>
            <circle cx="5" cy="6.5" r="1"/>
          </svg>
          <span className="text-xs">Image</span>
        </button>

        <button type="button" title="Image from URL"
          onMouseDown={(e) => { e.preventDefault(); insertImageFromURL(); }}
          className="px-2 py-1 rounded text-sm hover:bg-gray-200 text-gray-700 transition-colors text-xs">
          URL
        </button>

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <Sep />

        <label title="Text Color"
          className="flex items-center gap-0.5 text-xs text-gray-600 cursor-pointer px-1 py-1 rounded hover:bg-gray-200">
          <span className="font-semibold">A</span>
          <input type="color" defaultValue="#000000"
            onChange={(e) => exec("foreColor", e.target.value)}
            className="w-4 h-4 cursor-pointer border-0 p-0 rounded" />
        </label>

        <Sep />

        <Btn cmd="removeFormat" title="Clear Formatting"><span className="text-xs">✕</span></Btn>
      </div>

      {/* iframe */}
      <iframe ref={iframeRef} title="editor" className="w-full bg-white"
        style={{ minHeight: "300px", maxHeight: "420px", border: "none", display: "block" }} />

      {/* Hint */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5">
        <svg className="w-3 h-3 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="3" width="14" height="10" rx="1.5"/>
        </svg>
        <span className="text-xs text-gray-400">
          Click an image to select it · drag the blue corner handles to resize
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;