import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing! Realtime functions will not work. Falling back to mock client.');
  
  // Create a mock channel object
  const mockChannel = {
    on: function() {
      // Allow chaining
      return this;
    },
    subscribe: function(callback) {
      if (callback) {
        // Asynchronously call the callback with 'SUBSCRIBED'
        setTimeout(() => callback('SUBSCRIBED'), 0);
      }
      return this;
    },
    send: function(payload) {
      console.log('Mock Supabase send:', payload);
      return Promise.resolve('ok');
    },
    unsubscribe: function() {
      return Promise.resolve();
    }
  };

  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: (name) => {
      console.log(`Mock Supabase channel created for: ${name}`);
      return mockChannel;
    },
    removeChannel: () => {
      console.log('Mock Supabase removeChannel called');
      return Promise.resolve();
    },
    removeAllChannels: () => {
      return Promise.resolve();
    }
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;


