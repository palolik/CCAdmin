/* eslint-disable react/prop-types */
import { useEffect, useState, useRef, useCallback } from 'react';
import { MdClose } from 'react-icons/md';
import { TiArrowMinimise } from 'react-icons/ti';
import {
  FaPaperclip, FaFilePdf, FaFileWord,
  FaFileExcel, FaFileAlt, FaDownload
} from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { base_url, chat_url } from '../../config/config';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const isImage = (mime) => mime?.startsWith('image/');

const FileIcon = ({ mime }) => {
  if (mime?.includes('pdf'))                                return <FaFilePdf    className="text-red-400"   size={14} />;
  if (mime?.includes('word') || mime?.includes('document')) return <FaFileWord  className="text-blue-400"  size={14} />;
  if (mime?.includes('sheet') || mime?.includes('excel'))   return <FaFileExcel className="text-green-400" size={14} />;
  return <FaFileAlt className="text-slate-400" size={14} />;
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
                className="max-w-[180px] max-h-[140px] rounded-lg object-cover border border-white/20 hover:opacity-90 transition-opacity cursor-pointer"
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
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs no-underline transition-opacity hover:opacity-80 ${
              isManager
                ? 'bg-slate-600 border-slate-500 text-white'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
          >
            <FileIcon mime={file.mimetype} />
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate max-w-[120px]">{file.originalName}</span>
              <span className="opacity-60 text-[10px]">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <FaDownload size={9} className="ml-auto opacity-50 flex-shrink-0" />
          </a>
        );
      })}
    </div>
  );
};

/* ── main component ──────────────────────────────────────────────────────── */
const AdminempChat = ({ taskid, emid, dp, name, tname, tdesc, onClose, isVisible, onToggle }) => {
  const [messages, setMessages]         = useState([]);
  const [inputValue, setInputValue]     = useState('');
  const [socket, setSocket]             = useState(null);
  const [isSending, setIsSending]       = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const fileInputRef = useRef(null);
  const scrollRef    = useRef(null);
  const chatEndRef   = useRef(null);
  const isNearBottom = useRef(true);
  const prevCount    = useRef(0);

  /* ── scroll ── */
  const checkBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };
  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom.current)
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => {
    if (messages.length > prevCount.current) scrollToBottom();
    prevCount.current = messages.length;
  }, [messages, scrollToBottom]);

  /* ── fetch + poll ── */
  useEffect(() => {
    if (!taskid) return;
    const load = async () => {
      try {
        const r = await fetch(`${base_url}/empchat/${taskid}`);
        if (!r.ok) throw new Error();
        setMessages(await r.json());
      } catch { /* silent */ }
    };
    load();
    const t = setInterval(load, 300);
    return () => clearInterval(t);
  }, [taskid]);

  /* ── websocket ── */
  useEffect(() => {
    if (!taskid) return;
    const ws = new WebSocket(`${chat_url}?taskId=${taskid}`);
    setSocket(ws);
    ws.onopen    = () => console.log('WS connected');
    ws.onmessage = (e) => {
      const incoming = JSON.parse(e.data);
      setMessages(p => {
        if (p.some(m => m.time === incoming.time && m.text === incoming.text)) return p;
        return [...p, incoming];
      });
    };
    ws.onerror = (e) => console.error('WS error', e);
    ws.onclose = () => console.log('WS closed');
    return () => ws.close();
  }, [taskid]);

  /* ── send ── */
  const handleSend = async () => {
    const hasText  = inputValue.trim();
    const hasFiles = attachedFiles.length > 0;
    if ((!hasText && !hasFiles) || !socket || socket.readyState !== WebSocket.OPEN || isSending) return;

    setIsSending(true);
    isNearBottom.current = true;
    try {
      if (hasFiles) {
        const fd = new FormData();
        fd.append('taskId',  taskid);
        fd.append('empId',   emid);
        fd.append('empName', name);
        fd.append('sender',  'manager');
        fd.append('time',    new Date().toISOString());
        if (hasText) fd.append('text', hasText);
        attachedFiles.forEach(f => fd.append('files', f));

        const r   = await fetch(`${base_url}/addempchat/files`, { method: 'POST', body: fd });
        const msg = await r.json();
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
        setMessages(p => [...p, msg]);
      } else {
        const msg = {
          taskId: taskid, empId: emid, empName: name,
          sender: 'manager', text: hasText,
          time: new Date().toISOString(),
        };
        await fetch(`${base_url}/addempchat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        });
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
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

  /* ── render ── */
  return (
    <div
      className="flex flex-col mx-2 rounded-t-xl overflow-hidden shadow-2xl border border-slate-200"
      style={{ width: 380, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* title bar */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-slate-800 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <img
            src={dp || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
            className="w-7 h-7 rounded-full object-cover border-2 border-slate-600"
            onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/847/847969.png'; }}
          />
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-none truncate max-w-[180px]">{name || 'Employee'}</p>
            <p className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[180px]">{tname || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={onToggle} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors">
            <TiArrowMinimise size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-600 transition-colors">
            <MdClose size={15} />
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="flex flex-col bg-white" style={{ height: 460 }}>

          {/* employee info strip */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Employee ID</p>
              <p className="text-[11px] text-slate-700 font-mono truncate">{emid || '—'}</p>
            </div>
            {tdesc && (
              <div className="min-w-0 flex-1 border-l border-slate-200 pl-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Task</p>
                <div
                  className="text-[11px] text-slate-600 truncate prose-sm"
                  dangerouslySetInnerHTML={{ __html: tdesc }}
                />
              </div>
            )}
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            onScroll={checkBottom}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
          >
            {messages.map((msg, i) => {
              const isManager = msg.sender === 'manager';
              return (
                <div key={i} className={`flex gap-2 ${isManager ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img
                    src={isManager
                      ? 'https://i.ibb.co.com/N6wDTM7G/icon.png'
                      : dp}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-slate-200 mt-1"
                    onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/847/847969.png'; }}
                  />
                  <div className={`flex flex-col max-w-[70%] ${isManager ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isManager ? 'Manager' : name}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isManager
                        ? 'bg-slate-800 text-white rounded-tr-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                    }`}>
                      {msg.text && !msg.text.startsWith('📎') && <p>{msg.text}</p>}
                      <AttachmentBubble attachments={msg.attachments} isManager={isManager} />
                    </div>
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
                <span key={i} className="flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full border border-slate-200">
                  <FaPaperclip size={8} className="text-blue-400" />
                  <span className="max-w-[90px] truncate">{f.name}</span>
                  <button
                    onClick={() => setAttachedFiles(p => p.filter((_, j) => j !== i))}
                    className="ml-0.5 text-slate-400 hover:text-red-500 font-bold leading-none"
                  >×</button>
                </span>
              ))}
            </div>
          )}

          {/* input bar */}
          <div className="flex items-center gap-1.5 px-2 py-2 bg-white border-t border-slate-100">
            <input
              ref={fileInputRef} type="file" multiple accept="*/*" className="hidden"
              onChange={e => { setAttachedFiles(p => [...p, ...Array.from(e.target.files)]); e.target.value = ''; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 transition-colors"
              title="Attach files"
            >
              <FaPaperclip size={14} />
            </button>
            <input
              type="text"
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
              placeholder="Type a message…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && !attachedFiles.length) || isSending}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-150 ${
                (!inputValue.trim() && !attachedFiles.length) || isSending
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 shadow-sm'
              }`}
            >
              <IoSend size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminempChat;

