import supabaseClient from '../../lib/supabaseClient';

export default async function handler(req, res) {
  console.log("API Route: Handler function invoked");

  console.log("API Route: Fetching data from Supabase...");

  try {
    const { data, error } = await supabaseClient
      .from('sundaythoughts')
      .select('id, title, imageprompt, created_date, writeup, category, datedornot');

    if (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ error: 'Error fetching data' });
    }

    console.log("API Route: Successfully fetched data:", data);
    res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
} 