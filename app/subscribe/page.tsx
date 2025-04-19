"use client";

import { useState } from 'react';
import supabaseClient from '../../lib/supabaseClient'

export default function SubscribePage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    if (!firstName || !lastName || !email) {
      setMessage('All fields are required.');
      return;
    }

    console.log(`Attempting to subscribe with email: ${email}`);
    try {
      const { data, error } = await supabaseClient
        .from('public.Users') // Ensure the schema and table name are correct
        .insert([{ email }]);

      if (error) {
        console.error('Subscription error:', error.message);
        setMessage('Error subscribing. Please try again.');
      } else {
        console.log('Subscription successful:', data);
        setMessage('Subscription successful! You can now log in.');
      }
  } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Subscribe</h1>
      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="border p-2 mb-2"
      />
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border p-2 mb-2"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 mb-4"
      />
      <button onClick={handleSubscribe} className="bg-blue-500 text-white p-2">
        Subscribe
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
} 