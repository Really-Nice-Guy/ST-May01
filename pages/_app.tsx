import { AppProps } from 'next/app';

import supabase from '../lib/supabaseClient';
import '../styles/globals.css';

console.log('Supabase Client:', supabase);

function MyApp({ Component, pageProps }: AppProps) {
  return (

    <Component {...pageProps} />

  );
}

export default MyApp; 