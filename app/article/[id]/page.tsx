"use client"

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import supabase from '../../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Inter } from 'next/font/google';
import SelectionToolbar from '@/app/components/SelectionToolbar';
import ExplanationModal from '@/app/components/ExplanationModal';

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] });

interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export default function ArticlePage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [writeup, setWriteup] = useState<string>('');
  const [formatted, setFormatted] = useState<string>('');
  const [isFormatting, setIsFormatting] = useState<boolean>(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{x: number, y: number} | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);

  // Add state for podcast audio generation
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState<boolean>(false);

  // Debug function to clear authentication
  const clearAuth = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated');
      console.log("Authentication cleared");
    }
  };

  // Fetch the raw write-up and comments by article ID
  useEffect(() => {
    if (!id) return;
    supabase
      .from('sundaythoughts')
      .select('writeup, comments')
      .eq('id', Number(id))
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Error fetching write-up:', error);
        else if (data) {
          setWriteup(data.writeup);
          
          // Parse comments if they exist
          if (data.comments && Array.isArray(data.comments)) {
            setComments(data.comments.map((comment: any) => ({
              id: comment.id || String(Date.now()),
              text: comment.text,
              createdAt: comment.createdAt || new Date().toLocaleString()
            })));
          }
        }
      });
  }, [id]);

  // Stream formatted article once write-up is loaded
  useEffect(() => {
    if (!writeup) return;
    
    // Check if we have a cached formatted version for this article
    const cachedContent = localStorage.getItem(`formatted-article-${id}`);
    if (cachedContent) {
      setFormatted(cachedContent);
      setIsFormatting(false);
      return;
    }
    
    const streamArticle = async () => {
      const res = await fetch('/api/format-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'force-cache', // Use cache when available
        body: JSON.stringify({ text: writeup }),
      });
      if (!res.ok) {
        console.error('Failed to start streaming');
        setIsFormatting(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        chunk.split('\n\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const payload = line.replace(/^data: /, '').trim();
            if (payload === '[DONE]') {
              done = true;
            } else {
              try {
                const parsed = JSON.parse(payload);
                const delta = parsed.choices[0].delta.content;
                if (delta) {
                  fullContent += delta;
                  setFormatted(f => f + delta);
                }
              } catch {}
            }
          }
        });
      }

      // Cache the fully formatted content
      if (fullContent) {
        localStorage.setItem(`formatted-article-${id}`, fullContent);
      }

      setIsFormatting(false);
    };

    streamArticle();
  }, [writeup, id]);
  
  // Handle submitting a new comment
  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    // Create a new comment object
    const newCommentObj = {
      id: Date.now().toString(),
      text: newComment,
      createdAt: new Date().toLocaleString()
    };
    
    // Add the new comment to the existing comments
    const updatedComments = [...comments, newCommentObj];
    
    try {
      // Update the comments column in the sundaythoughts table
      const { error } = await supabase
        .from('sundaythoughts')
        .update({ comments: updatedComments })
        .eq('id', Number(id));
        
      if (error) throw error;
      
      // Update local state with the new comments
      setComments(updatedComments);
      
      // Clear form
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Simple window-based scroll tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.body.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = documentHeight - windowHeight;
      
      // Calculate percentage and clamp between 0-100
      let percentage = 0;
      if (maxScroll > 0) {
        percentage = Math.min(Math.max((scrollY / maxScroll) * 100, 0), 100);
      }
      
      setScrollProgress(percentage);
    };
    
    // Add event listener
    window.addEventListener('scroll', handleScroll);
    
    // Run once on mount
    handleScroll();
    
    // Initialize again after formatting completes
    if (!isFormatting) {
      setTimeout(handleScroll, 500);
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFormatting]); // Re-run when formatting state changes

  // Text selection handling
  useEffect(() => {
    // Delay reading selection until after mouseup event has fully processed
    const handleMouseUp = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
          setSelectedText('');
          setSelectionPosition(null);
          return;
        }
        const text = sel.toString().trim();
        if (!text) {
          setSelectedText('');
          setSelectionPosition(null);
          return;
        }
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 30
        });
      }, 0);
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);
  
  // Clear selection when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't clear selection when explanation modal is open
      if (isExplanationOpen) return;
      const target = e.target as Node;
      const contentArea = contentRef.current;
      
      // Don't clear if clicking inside content area or on toolbar buttons
      if ((contentArea && contentArea.contains(target)) || 
          target.nodeName === 'BUTTON' || 
          (target.parentNode && target.parentNode.nodeName === 'BUTTON')) {
        return;
      }
      
      setSelectedText('');
      setSelectionPosition(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExplanationOpen]);  // Re-run when modal open/close state changes
  
  const handleExplain = (text: string) => {
    setIsExplanationOpen(true);
  };
  
  const handleCloseToolbar = () => {
    setSelectedText('');
    setSelectionPosition(null);
  };

  // Generate or retrieve podcast audio via Eleven Labs and Supabase Storage
  useEffect(() => {
    if (!writeup) return;
    if (audioUrl) return;

    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const fileName = `sundaythoughts_${day}_${month}_${year}.mp4`;
    const bucket = 'articlepodcast';

    setIsGeneratingPodcast(true);

    (async () => {
      try {
        // Check if file already exists publicly
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        const publicUrl = publicData.publicUrl;
        if (publicUrl) {
          const headRes = await fetch(publicUrl, { method: 'HEAD' });
          if (headRes.ok) {
            setAudioUrl(publicUrl);
            return;
          }
        }

        // File doesn't exist: generate new audio via Eleven Labs
        const res = await fetch('/api/podcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, text: writeup })
        });
        if (!res.ok) throw new Error('Failed to generate podcast');
        const blob = await res.blob();

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase
          .storage
          .from(bucket)
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'audio/mpeg'
          });
        if (uploadError) throw uploadError;

        // Retrieve public URL after upload
        const { data: newPublicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        setAudioUrl(newPublicData.publicUrl);
      } catch (error) {
        console.error(error);
      } finally {
        setIsGeneratingPodcast(false);
      }
    })();
  }, [writeup]);

  return (
    <div className={`min-h-screen ${inter.className}`}>
      {/* Progress bar */}
      <div 
        className="fixed top-0 left-0 right-0 w-full h-[3px] z-[9999]"
        style={{ 
          background: 'linear-gradient(to right, #000000 0%, #000000 ' + scrollProgress + '%, #f0f0f0 ' + scrollProgress + '%, #f0f0f0 100%)',
        }}
      />
      
      {/* Back button and comment count */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => {
            // Ensure authentication is set before navigating home
            if (typeof window !== 'undefined') {
              localStorage.setItem('isAuthenticated', 'true');
            }
            router.push('/');
          }}
          className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="ml-2">Home</span>
        </button>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-medium">{comments.length} Comments</span>
        </div>
      </div>

      {/* Podcast player */}
      <div className="p-4">
        {isGeneratingPodcast ? (
          <p>Generating podcast...</p>
        ) : audioUrl ? (
          <audio controls src={audioUrl} className="w-full" />
        ) : null}
      </div>

      {/* Debug button - hidden in UI but accessible in dev tools */}
      <button 
        onClick={clearAuth} 
        style={{ position: 'fixed', bottom: '10px', right: '10px', opacity: 0, pointerEvents: 'none' }}
      >
        Clear Auth
      </button>

      {/* Selection toolbar */}
      <SelectionToolbar 
        position={selectionPosition}
        selectedText={selectedText}
        onClose={handleCloseToolbar}
        onExplain={handleExplain}
      />
      
      {/* Explanation modal */}
      <ExplanationModal 
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        selectedText={selectedText}
      />

      {/* Article content */}
      <div className="flex-1 flex justify-center">
        <div 
          className="w-full max-w-5xl p-8 prose prose-lg dark:prose-invert relative"
          ref={contentRef}
        >
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {formatted}
          </ReactMarkdown>
          
          {isFormatting && (
            <p className="text-gray-500 mt-4">Formatting article...</p>
          )}
          
          {/* Comments section - only shows when formatting is complete */}
          {!isFormatting && (
            <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-8">
              <h2 className="text-2xl font-medium mb-6">Comments ({comments.length})</h2>
              
              {/* Comments list */}
              <div className="space-y-4 mb-10">
                {comments.length === 0 ? (
                  <p className="text-gray-500 italic">Be the first to comment on this article!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="py-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">{comment.createdAt}</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add comment form */}
              <form onSubmit={handleSubmitComment} className="border border-gray-200 dark:border-gray-800 rounded-md">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-medium">Add Your Comment</h3>
                </div>
                
                <div className="p-5">
                  <textarea
                    id="commentText"
                    rows={4}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full px-3 py-2 text-sm bg-transparent border border-gray-200 dark:border-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600"
                    required
                  ></textarea>
                  
                  <button
                    type="submit"
                    className="mt-3 px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 