"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'

// Define the Article type
type Article = {
  id: number;
  title: string;
  image: string;
  created_date: string;
  writeup: string;
  category: string;
  datedornot: boolean;
  articlepdffile: string;
};

export default function Page() {
  const router = useRouter();

  console.log("Page component mounted");

  // Use the Article type for state
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState({ field: 'created_date', order: 'desc' });
  const [latestArticleId, setLatestArticleId] = useState<number | null>(null);
  const [visibleArticles, setVisibleArticles] = useState({ start: 1, end: 5 });
  const [email, setEmail] = useState('');
  const [isEmailFormVisible, setIsEmailFormVisible] = useState(true);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  const fetchArticles = async (sortField = 'created_date', sortOrder = 'desc') => {
    console.log(`Fetching articles sorted by ${sortField} in ${sortOrder} order...`);

    const { data, error } = await supabase
      .from('sundaythoughts')
      .select('id, title, image, created_date, writeup, category, datedornot, articlepdffile')
      .order(sortField, { ascending: sortOrder === 'asc' });

    if (error) {
      console.error('Error fetching articles:', error);
    } else {
      console.log("Successfully fetched data from Supabase:", data);
      setArticles(data as Article[]);
      setFilteredArticles(data as Article[]);
      console.log("Articles state updated:", data);

      // Determine the latest article
      if (data.length > 0) {
        const latestArticle = data.reduce((latest, current) => {
          return new Date(current.created_date) > new Date(latest.created_date) ? current : latest;
        }, data[0]);
        setLatestArticleId(latestArticle.id);
      }
    }
  };

  useEffect(() => {
    fetchArticles(); // Initial fetch with default sorting
  }, []); // Empty dependency array ensures this runs only once on the client

  useEffect(() => {
    let updatedArticles = articles;

    // Filter by category
    if (selectedCategory !== 'all') {
      updatedArticles = updatedArticles.filter(article =>
        article.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredArticles(updatedArticles);
  }, [articles, selectedCategory]);

  const handleSortChange = (field: string, order: string) => {
    setSortOption({ field, order });
    fetchArticles(field, order);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const isNew = (articleId: number) => {
    // Tag the article with the latest created_date as "NEW"
    return articleId === latestArticleId;
  };

  const getPublicUrl = (bucket: string, path: string): string => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `https://ghsggshkbeszyvtufklf.supabase.co/storage/v1/object/public/${bucket}/${cleanPath}`;
  };

  const handleShowMore = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleScroll = (direction: string) => {
    setVisibleArticles((prev) => {
      const newStart = direction === 'up' ? Math.max(prev.start - 2, 1) : Math.min(prev.start + 2, filteredArticles.length - 4);
      const newEnd = direction === 'up' ? Math.max(prev.end - 2, 5) : Math.min(prev.end + 2, filteredArticles.length);
      return { start: newStart, end: newEnd };
    });
  };

  const getFirst100Words = (text: string) => {
    return text.split(' ').slice(0, 100).join(' ') + '...';
  };

  // Function to handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the email already exists in the Users table
    const { data: existingEmailData, error: existingEmailError } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email);

    if (existingEmailError) {
      console.error('Error checking existing email:', existingEmailError.message, existingEmailError.details);
      return;
    }

    if (existingEmailData.length > 0) {
      console.log('Email exists, allowing access:', email);
      setIsEmailFormVisible(false);
      setEmailExists(true);
      return;
    }

    console.log('Email not found, prompting request access:', email);
    setEmailExists(false);
  };

  // Function to handle request access
  const handleRequestAccess = () => {
    const subject = encodeURIComponent('Request for Access to Sunday Thoughts');
    const body = encodeURIComponent(`Hello,

I would like to request access to the Sunday Thoughts collection, please take my money!

Thank you!`);
    window.location.href = `mailto:hshah@yahoo.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Sunday Thoughts</h1>
        <p className="mt-2 text-lg text-gray-600">A Collection of Insights and Reflections</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Input type="search" placeholder="Search titles..." className="flex-1" />
        <Select onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="geopolitics">Geopolitics</SelectItem>
            <SelectItem value="tech">New Age Technology</SelectItem>
            <SelectItem value="leadership">Thought Leadership</SelectItem>
            <SelectItem value="ai">AI/Data Cloud</SelectItem>
            <SelectItem value="macro">Macroeconomy</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => handleSortChange(value, sortOption.order)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="created_date">Date</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => handleSortChange(sortOption.field, value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Left Section */}
        <div className="flex-1">
          {filteredArticles.slice(0, 1).map((article) => {
            const imageUrl = getPublicUrl('images', article.image);
            const pdfUrl = getPublicUrl('articlepdffile', article.articlepdffile);
            const writeupExcerpt = getFirst100Words(article.writeup);

            return (
              <div key={article.id} className="mb-8 relative">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt=""
                  width={200}
                  height={200}
                  className="rounded-lg object-cover mb-4"
                />
                <h2 className="text-xl font-bold">{article.title}</h2>
                <p className="text-sm text-gray-600">{article.category}</p>
                <p className="text-sm text-gray-600">{formatDate(article.created_date)}</p>
                <p className="mt-2 text-gray-800">{writeupExcerpt}</p>
                <Button variant="default" onClick={() => handleShowMore(pdfUrl)} className="mt-4">
                  Show More
                </Button>
                {isNew(article.id) && (
                  <button onClick={() => handleShowMore(pdfUrl)} className="absolute top-0 right-0 text-4xl font-bold text-green-700">
                    New (#{article.id})
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="w-1/3 border p-4 rounded-lg relative">
          <div className="grid grid-cols-2 gap-4 pr-8">
            {filteredArticles.slice(visibleArticles.start, visibleArticles.end).map((article) => {
              const imageUrl = getPublicUrl('images', article.image);
              const pdfUrl = getPublicUrl('articlepdffile', article.articlepdffile);

              return (
                <div key={article.id} className="mb-4 flex flex-col justify-between h-full">
                  <div>
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt=""
                      width={100}
                      height={100}
                      className="rounded-lg object-cover mb-2"
                    />
                    <h3 className="text-lg font-medium">{article.title}</h3>
                    <p className="text-sm text-gray-600">{article.category}</p>
                    <p className="text-sm text-gray-600">{formatDate(article.created_date)}</p>
                  </div>
                  <Button variant="default" onClick={() => window.open(pdfUrl, '_blank')} className="mt-2">
                    View
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="absolute top-0 right-0 flex flex-col h-full justify-between border-l border-gray-300">
            <button onClick={() => handleScroll('up')} className="w-8 h-8 bg-gray-300 hover:bg-gray-400 rounded flex items-center justify-center m-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button onClick={() => handleScroll('down')} className="w-8 h-8 bg-gray-300 hover:bg-gray-400 rounded flex items-center justify-center m-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Email Collection Form */}
      {isEmailFormVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <form onSubmit={handleEmailSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-3xl font-bold mb-6 text-center">Join Our Community</h2>
            <p className="text-center text-gray-700 mb-4">Enter your email to access exclusive content.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="border p-3 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button type="submit" className="bg-blue-600 text-white p-3 rounded w-full mb-4 hover:bg-blue-700">Retry with a Different Email</button>
            {emailExists === false && (
              <button type="button" onClick={handleRequestAccess} className="bg-green-500 text-white p-3 rounded w-full hover:bg-green-600">Request Access</button>
            )}
          </form>
        </div>
      )}
    </div>
  )
}