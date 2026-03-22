/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react';
import { MdClose } from 'react-icons/md';
import { TiArrowMinimise } from 'react-icons/ti';
import { base_url } from '../../config/config';
import { chat_url } from '../../config/config';
const Chat = ({ taskid, emid, dp, name, tname, tdesc, onClose, isVisible, onToggle }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [socket, setSocket] = useState(null);
    const [isSending, setIsSending] = useState(false);  
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`${base_url}/empchat/${taskid}`);
                if (!response.ok) throw new Error('Failed to fetch messages');
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        if (taskid) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 300);
            return () => clearInterval(interval);
        }
    }, [taskid]);

    useEffect(() => {
        const newSocket = new WebSocket(`${chat_url}`);
        setSocket(newSocket);

        newSocket.onopen = () => console.log('Connected to WebSocket server');

        newSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, message]);
        };

        newSocket.onerror = (error) => console.error('WebSocket error:', error);

        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (inputValue.trim() && socket && !isSending) {
            const message = {
                taskId: taskid,
                empId: emid,
                empName: name,
                sender: "manager",
                text: inputValue,
                time: new Date().toLocaleTimeString(),
            };

            setIsSending(true); 

            try {
                await fetch(`${base_url}/addempchat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message),
                });

                socket.send(JSON.stringify(message));
                setMessages((prevMessages) => [...prevMessages, message]);
                setInputValue(''); 
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                setIsSending(false); 
            }
        }
    };

    return (
        <div className="flex flex-col justify-between mx-2 border-blue-500 border-x-[1px] bg-blue-50 rounded-t-lg items-center" style={{ maxHeight: 'max-content' }}>
            <div className="flex flex-row items-center w-full p-2 justify-between">
                <p className="font-bold">{name}</p>
                <div className="flex">
                    <TiArrowMinimise className="h-6 w-6 hover:text-blue-300 cursor-pointer" onClick={onToggle} />
                    <MdClose className="h-6 w-6 hover:text-red-300 cursor-pointer" onClick={onClose} />
                </div>
            </div>

            {isVisible && (
                <div className="h-[450px] flex flex-row bg-white">
                    <div className='bg-blue-50 w-full'>
                        <div className='h-[400px] border m-1 px-4 bg-white overflow-y-auto'>
                        {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat ${msg.sender === 'emp' ? 'chat-start' : 'chat-end'}`}
            >
              <div className="chat-image avatar">
                <div className="w-10">
                  <img className='rounded-full' src={msg.sender === 'emp' ? dp : 'https://static-00.iconduck.com/assets.00/user-avatar-1-icon-2048x2048-935gruik.png'} />
                </div>
              </div>
              <div className="chat-header flex flex-row items-center">
                <p>{msg.sender === 'manager' ? 'Manager' : name }</p>
                <time className="text-xs opacity-50"> - {msg.time}</time>
              </div>
              <div className={`chat-bubble w-72 ${msg.sender === 'manager' ? 'bg-cyan-50 text-black' : 'bg-gray-100 text-black'}`}>
                {msg.text}
              </div>
            </div>
          ))}
                        </div>
                        <div className='flex flex-row items-center'>
                                <input
                                    type="text"
                                    className="grow p-2"
                                    placeholder="Type your message here..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button className="bg-gradient-to-b from-sky-500 to-indigo-600 p-2 text-white rounded-r-lg mr-0 w-20 hover:bg-gradient-to-t"
                                    onClick={handleSendMessage}  disabled={!inputValue.trim() || isSending} > Send</button>
                        </div>
                    </div>

                    <div className="w-80 flex flex-col px-1 bg-blue-50 h-full items-start">
                        <div className="flex w-full"><img src={dp} className="h-10 w-10 "/><div className='pl-2'><p className='font-bold'>{name}</p> <p className="text-[10px]">{emid}</p></div></div>
                        <div>{tname}</div>
                        <div>{tdesc}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
