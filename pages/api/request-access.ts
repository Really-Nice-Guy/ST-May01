import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the service role key for insert permissions
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Insert the new user with only the email field populated
  const { data, error } = await supabase
    .from('Users')
    .insert([{ email }])
    .select();

  if (error) {
    // If the email already exists, you may want to handle this gracefully
    return res.status(400).json({ message: error.message });
  }

  return res.status(200).json({ message: 'Request recorded', data });
} 