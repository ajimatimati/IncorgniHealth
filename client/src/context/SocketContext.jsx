import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    // Only connect if we have a token (user logged in)
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001', {
      auth: { token }
    });

    setSocket(newSocket);

    // Keep this for any existing non-webrtc socket listeners if needed (e.g. queue updates, chat room)

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{
      socket,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
