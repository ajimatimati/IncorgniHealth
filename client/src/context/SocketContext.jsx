import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) return;

    // We create a mock Socket interface to prevent the need for rewrites 
    // across all WebRTC and Doctor queue components, mapping them to Supabase PubSub.
    const fakeSocket = {
      channels: {},
      _listeners: {},
      id: user?.id || Math.random().toString(36).substring(7),
      
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
            const chan = this.channels['doctor-pool'] || supabase.channel('doctor-pool');
            let lastPatients = [];
            chan.on('presence', { event: 'sync' }, () => {
               const state = chan.presenceState();
               const patients = [];
               Object.values(state).forEach(presences => {
                  presences.forEach(p => {
                     if (p.type === 'patient') {
                        patients.push(p);
                     }
                  });
               });
               this._trigger('active-patients', patients);

               // Compare and trigger patient-arrived / patient-left for full backward compatibility
               patients.forEach(p => {
                  if (!lastPatients.some(lp => lp.socketId === p.socketId)) {
                     this._trigger('patient-arrived', p);
                  }
               });
               lastPatients.forEach(lp => {
                  if (!patients.some(p => p.socketId === lp.socketId)) {
                     this._trigger('patient-left', lp.socketId);
                  }
               });
               lastPatients = patients;
            });
            chan.subscribe();
            this.channels['doctor-pool'] = chan;
         } else if (event === 'join-waiting-room') {
            const chan = this.channels['doctor-pool'] || supabase.channel('doctor-pool');
            chan.subscribe(async (status) => {
               if (status === 'SUBSCRIBED') {
                  await chan.track({
                     type: 'patient',
                     userId: user?.id || data.patientInfo.userId,
                     nickname: user?.nickname || data.patientInfo.nickname || 'Client',
                     publicId: user?.publicId || 'Anonymous',
                     socketId: this.id,
                     joinedAt: new Date()
                  });
               }
            });
            this.channels['waiting'] = chan;
         } else if (event === 'admit-patient') {
            const chan = this.channels['doctor-pool'] || supabase.channel('doctor-pool');
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
    
    // Wire up the admit broadcast on the existing doctor-pool channel if it exists,
    // otherwise create it (will be reused when doctor-join or join-waiting-room fires)
    const admitChan = fakeSocket.channels['doctor-pool'] || supabase.channel('doctor-pool');
    admitChan.on('broadcast', { event: 'admit-patient' }, (p) => fakeSocket._trigger('admit-patient', p.payload));
    if (!fakeSocket.channels['doctor-pool']) {
      admitChan.subscribe();
      fakeSocket.channels['doctor-pool'] = admitChan;
    }

    setSocket(fakeSocket);
    
    return () => fakeSocket.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
