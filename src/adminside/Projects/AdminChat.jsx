/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useCallback } from 'react';
import { MdClose } from 'react-icons/md';
import { TiArrowMinimise } from 'react-icons/ti';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';
import {
  FaPaperclip, FaFilePdf, FaFileWord,
  FaFileExcel, FaFileAlt, FaDownload, FaChevronDown
} from 'react-icons/fa';
import { base_url, chat_url } from '../../config/config';

/* ── helpers ─────────────────────────────────────────────── */
const isImage = (mime) => mime?.startsWith('image/');

const FileIcon = ({ mime }) => {
  if (mime?.includes('pdf'))                             return <FaFilePdf    className="text-red-400"   size={16} />;
  if (mime?.includes('word') || mime?.includes('document')) return <FaFileWord  className="text-blue-400"  size={16} />;
  if (mime?.includes('sheet') || mime?.includes('excel'))   return <FaFileExcel className="text-green-400" size={16} />;
  return <FaFileAlt className="text-slate-400" size={16} />;
};

const AttachmentBubble = ({ attachments, isManager }) => {
  if (!attachments?.length) return null;
  return (
    <div className="flex flex-col gap-1 mt-1">
      {attachments.map((file, i) => {
        if (isImage(file.mimetype)) {
          return (
            <a key={i} href={`${base_url}${file.url}`} target="_blank" rel="noopener noreferrer">
              <img
                src={`${base_url}${file.url}`}
                alt={file.originalName}
                className="max-w-[200px] max-h-[160px] rounded-lg object-cover shadow-sm hover:opacity-90 transition-opacity border border-white/30"
              />
            </a>
          );
        }
        return (
          <a
            key={i}
            href={`${base_url}${file.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs no-underline transition-opacity hover:opacity-80 ${
              isManager
                ? 'bg-cyan-100 border-cyan-200 text-slate-700'
                : 'bg-slate-700 border-slate-600 text-white'
            }`}
          >
            <FileIcon mime={file.mimetype} />
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate max-w-[130px]">{file.originalName}</span>
              <span className="opacity-60">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <FaDownload size={10} className="ml-auto opacity-50 flex-shrink-0" />
          </a>
        );
      })}
    </div>
  );
};
const SeenLabel = ({ read }) => (
  read
    ? <span className="text-[10px] text-slate-400 mt-0.5">Seen</span>
    : <span className="text-[10px] text-slate-500 mt-0.5">Sent</span>
);
/* ── main component ──────────────────────────────────────── */
const Chat = ({
  orderId, buyerid, bdp, name,
  onClose, isVisible, onToggle,
  projectTitle, buyerName, packageContents , packageType
}) => {
  const [messages, setMessages]                   = useState([]);
  const [inputValue, setInputValue]               = useState('');
  const [socket, setSocket]                       = useState(null);
  const [isSending, setIsSending]                 = useState(false);
  const [updatedPackageContents, setUpdatedPackageContents] = useState(packageContents);
  const [attachedFiles, setAttachedFiles]         = useState([]);
  const fileInputRef  = useRef(null);
  const chatEndRef    = useRef(null);
  const scrollRef     = useRef(null);
  const isNearBottom  = useRef(true);
const isVisibleRef = useRef(false);

  /* scroll logic */
  const checkBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };
  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom.current)
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const prevCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevCount.current) scrollToBottom();
    prevCount.current = messages.length;
  }, [messages, scrollToBottom]);

  useEffect(() => {
  isVisibleRef.current = isVisible;
  if (isVisible && orderId) markMessagesRead();
}, [isVisible, orderId]);

// Mark client's messages as read
const markMessagesRead = async () => {
  if (!orderId) return;
  try {
    await fetch(`${base_url}/clichat/mark-read/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "client" }), // mark client's msgs as read
    });
  } catch (err) {
    console.error("Error marking as read:", err);
  }
};
  /* fetch messages */
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${base_url}/clichat/${orderId}`);
        if (!r.ok) throw new Error();
        setMessages(await r.json());
      } catch { /* silent */ }
    };
    if (orderId) {
      fetch_();
      const t = setInterval(fetch_, 300);
      return () => clearInterval(t);
    }
  }, [orderId]);

  /* websocket — include orderId so backend routes broadcasts to the right room */
  useEffect(() => {
    if (!orderId) return;
    const ws = new WebSocket(`${chat_url}?orderId=${orderId}`);
    setSocket(ws);
    ws.onopen    = () => console.log('WS connected');
  ws.onmessage = (e) => {
  const data = JSON.parse(e.data);

  // Ignore initial history array dump
  if (Array.isArray(data)) return;

  // Handle read_update broadcast from the other side
  if (data.type === "read_update") {
    setMessages(prev =>
      prev.map(m =>
        m.sender === data.sender ? { ...m, read: true } : m
      )
    );
    return;
  }

  setMessages(p => {
    if (p.some(m => m.time === data.time && m.text === data.text)) return p;
    return [...p, data];
  });
};
    ws.onerror = (e) => console.error('WS error', e);
    return () => ws.close();
  }, [orderId]);

const lastManagerMsgIndex = messages.map(m => m.sender).lastIndexOf("manager");

  /* send message */
const handleSend = async () => {
  const hasText  = inputValue.trim();
  const hasFiles = attachedFiles.length > 0;

  // ✅ Removed socket readyState check — backend handles persistence
  if ((!hasText && !hasFiles) || isSending) return;

  setIsSending(true);
  isNearBottom.current = true;
  try {
    if (hasFiles) {
      const fd = new FormData();
      fd.append('orderId', orderId);
      fd.append('bId', buyerid);
      fd.append('bName', buyerName);
      fd.append('sender', 'manager');
      fd.append('time', new Date().toISOString());
      fd.append('text', hasText || attachedFiles.map(f => f.name).join(', '));
      attachedFiles.forEach(f => fd.append('files', f));

      const r = await fetch(`${base_url}/addclichat/files`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
      const msg = await r.json();

      // ✅ Only send via WS if open — not required for message to be saved
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
      setMessages(p => [...p, msg]);

    } else {
      const msg = {
        orderId, bId: buyerid, bName: buyerName,
        sender: 'manager', text: hasText,
        time: new Date().toISOString(),
        read: false,
      };

      await fetch(`${base_url}/addclichat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });

      // ✅ Only send via WS if open
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
      setMessages(p => [...p, msg]);
    }

    setInputValue('');
    setAttachedFiles([]);
  } catch (e) {
    console.error('Send error:', e);
  } finally {
    setIsSending(false);
  }
};
  /* toggle package content */
   const handleToggleContent = async (index) => {
    const updated = updatedPackageContents.map((item, i) =>
      i === index ? { ...item, isDone: !item.isDone } : item
    );
    setUpdatedPackageContents(updated);
    try {
       const endpoint = packageType === 'custom'
  ? `${base_url}/updateordercustomcontents/${orderId}`  // custom → custom endpoint
  : `${base_url}/updateordercontents/${orderId}`;        // regular → regular endpoint
      
          const res = await fetch(endpoint,  {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageContents: updated }),
      });
    } catch (e) { console.error(e); }
  };


  const doneCount  = updatedPackageContents?.filter(c => c.isDone).length ?? 0;
  const totalCount = updatedPackageContents?.length ?? 0;

  return (
    <div
  className="flex flex-col rounded-xl overflow-hidden shadow-2xl border border-slate-200 w-[min(640px,calc(100vw-16px))]"
  style={{ maxHeight: 'max-content', fontFamily: "'DM Sans', sans-serif" }}
>
      {/* ── title bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-2.5">
          <img
            src={bdp || 'https://i.ibb.co.com/N6wDTM7G/icon.png'}
            className="w-7 h-7 rounded-full border-2 border-slate-500 object-cover"
          />
          <div>
            <p className="text-white text-sm font-semibold leading-none">{buyerName || 'N/A'}</p>
            <p className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[160px]">{projectTitle || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
          >
            {isVisible ? <TiArrowMinimise size={16} /> : <FaChevronDown size={13} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-600 transition-colors"
          >
            <MdClose size={16} />
          </button>
        </div>
      </div>

      {isVisible && (
       <div className="flex flex-row bg-white h-[360px] md:h-[460px]">

          {/* ── chat panel ── */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-slate-100">

            {/* messages */}
            <div
              ref={scrollRef}
              onScroll={checkBottom}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
            >
              {messages.map((msg, i) => {
                const isManager = msg.sender === 'manager';
                return (
                  <div key={i} className={`flex gap-2.5 ${isManager ? 'flex-row-reverse' : 'flex-row'}`}>
                    <img
                      src={isManager
                        ? 'https://static-00.iconduck.com/assets.00/user-avatar-1-icon-2048x2048-935gruik.png'
                        : bdp}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-slate-200 mt-1"
                    />
                    <div className={`flex flex-col max-w-[65%] ${isManager ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-semibold text-slate-500">
                          {isManager ? 'Manager' : name}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isManager
                            ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-tr-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                        }`}
                      >
                        {msg.text && !msg.text.startsWith('📎') && <p>{msg.text}</p>}
                        <AttachmentBubble attachments={msg.attachments} isManager={isManager} />
                      </div>
                      {isManager && i === lastManagerMsgIndex && (
  <SeenLabel read={msg.read} />
)}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* pending file chips */}
            {attachedFiles.length > 0 && (
              <div className="px-3 py-1.5 border-t border-slate-100 bg-white flex flex-wrap gap-1.5">
                {attachedFiles.map((f, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full border border-slate-200"
                  >
                    <FaPaperclip size={9} className="text-blue-400" />
                    <span className="max-w-[100px] truncate">{f.name}</span>
                    <button
                      onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))}
                      className="ml-0.5 text-slate-400 hover:text-red-500 font-bold"
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            {/* input bar */}
            <div className="flex items-center gap-1.5 px-2 py-2 bg-white border-t border-slate-100">
           {/* Replace the hidden file input */}
<input
  ref={fileInputRef}
  type="file"
  multiple
  className="hidden"
  onClick={e => { e.target.value = null; }} // ✅ reset before opening so same file can be reselected
  onChange={e => {
    const files = Array.from(e.target.files);
    if (files.length) setAttachedFiles(p => [...p, ...files]);
  }}
/>
              {/* attach */}
            <button
  type="button" // ✅ prevent accidental form submit
  onClick={e => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  }}
  className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 transition-colors"
  title="Attach files"
>
  <FaPaperclip size={15} />
</button>
              {/* text */}
              <input
                type="text"
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                placeholder="Type a message…"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              {/* send */}
              <button
                onClick={handleSend}
                disabled={(!inputValue.trim() && !attachedFiles.length) || isSending}
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                  (!inputValue.trim() && !attachedFiles.length) || isSending
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 shadow-sm'
                }`}
              >
                Send
              </button>
            </div>
          </div>

          {/* ── sidebar ── */}
          <div className="hidden md:flex w-52 flex-col bg-white overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
          >
            {/* buyer card */}
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <img src={bdp} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{buyerName || 'N/A'}</p>
                  <p className="text-[9px] text-slate-400 truncate">{buyerid}</p>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Order</p>
                <p className="text-[11px] text-slate-700 font-mono truncate">{orderId || '—'}</p>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Project</p>
                <p className="text-[11px] text-slate-700 font-semibold leading-tight">{projectTitle || '—'}</p>
              </div>
            </div>

            {/* package contents */}
            <div className="p-3 flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Deliverables</p>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
                  {doneCount}/{totalCount}
                </span>
              </div>

              {/* progress bar */}
              <div className="h-1 bg-slate-100 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: totalCount ? `${(doneCount / totalCount) * 100}%` : '0%' }}
                />
              </div>

              <ul className="space-y-1.5">
                {updatedPackageContents?.map((content, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => handleToggleContent(index)}
                  >
                    <div className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      content.isDone ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-slate-300'
                    }`}>
                      {content.isDone && (
                        <IoCheckmarkDoneOutline className="text-white" size={10} />
                      )}
                    </div>
                    <span className={`text-[11px] leading-tight transition-colors ${
                      content.isDone ? 'text-slate-400 line-through' : 'text-slate-700'
                    }`}>
                      {content.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Chat;