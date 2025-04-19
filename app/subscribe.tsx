"use client";

import { useState } from 'react';
import supabaseClient from '@/lib/supabaseClient';

export default function SubscribePage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    if (!firstName || !lastName || !email || !password) {
      setMessage('All fields are required.');
      return;
    }

    console.log(`Attempting to register with email: ${email}`);
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      console.error('Registration error:', error.message);
      setMessage('Error registering. Please try again.');
    } else {
      console.log('Registration successful');
      setMessage('Registration successful! Please check your email to confirm your account.');
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
        className="border p-2 mb-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-4"
      />
      <button onClick={handleSubscribe} className="bg-blue-500 text-white p-2">
        Register
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
} 