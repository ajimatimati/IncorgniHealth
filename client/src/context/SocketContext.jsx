import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // We create a mock Socket interface to prevent the need for rewrites 
    // across all WebRTC and Doctor queue components, mapping them to Supabase PubSub.
    const fakeSocket = {
      channels: {},
      _listeners: {},
      id: supabase.auth.getSession()?.data?.session?.user?.id || Math.random().toString(36).substring(7),
      
      emit: function(event, data) {
         if (event === 'join_room') {
            const chan = supabase.channel(`webrtc-${data}`);
            chan.on('broadcast', { event: 'all' }, (payload) => this._trigger(payload.event, payload.payload));
            chan.subscribe();
            this.channels[`webrtc-${data}`] = chan;
         } else if (['offer', 'answer', 'ice-candidate'].includes(event)) {
             // WebRTC signaling
            const chan = this.channels[`webrtc-${data.roomId}`];
            if (chan) chan.send({ type: 'broadcast', event: event, payload: data });
         } else if (event === 'doctor-join') {
            const chan = supabase.channel('doctor-pool');
            chan.on('broadcast', { event: 'patient-arrived' }, (payload) => this._trigger('patient-arrived', payload.payload));
            chan.on('broadcast', { event: 'patient-left' }, (payload) => this._trigger('patient-left', payload.payload));
            chan.subscribe();
            this.channels['doctor-pool'] = chan;
         } else if (event === 'join-waiting-room') {
            const chan = Object.values(this.channels).find(c => c.topic === 'realtime:doctor-pool') || supabase.channel('doctor-pool');
            chan.subscribe((status) => {
               if (status === 'SUBSCRIBED') {
                  chan.send({ type: 'broadcast', event: 'patient-arrived', payload: { ...data.patientInfo, socketId: this.id, joinedAt: new Date() } });
               }
            });
            this.channels['waiting'] = chan;
         } else if (event === 'admit-patient') {
            const chan = Object.values(this.channels).find(c => c.topic === 'realtime:doctor-pool');
            if (chan) chan.send({ type: 'broadcast', event: 'admit-patient', payload: data });
         }
      },
      
      on: function(event, callback) {
         if (!this._listeners[event]) this._listeners[event] = [];
         this._listeners[event].push(callback);
      },
      off: function(event, callback) {
         if (!this._listeners[event]) return;
         if (callback) this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
         else this._listeners[event] = [];
      },
      _trigger: function(event, data) {
         if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(data));
         }
      },
      disconnect: function() {
         Object.values(this.channels).forEach(chan => supabase.removeChannel(chan));
         this.channels = {};
      }
    };
    
    // Wire up the admit broadcast separately
    const globalAdmitChan = supabase.channel('doctor-pool');
    globalAdmitChan.on('broadcast', { event: 'admit-patient' }, (p) => fakeSocket._trigger('admit-patient', p.payload)).subscribe();
    fakeSocket.channels['globalAdmit'] = globalAdmitChan;

    setSocket(fakeSocket);
    
    return () => fakeSocket.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
