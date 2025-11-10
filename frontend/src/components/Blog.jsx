import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, [page, selectedCategory]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const url = selectedCategory 
        ? `/api/v1/blogs?page=${page}&limit=9&category=${selectedCategory}`
        : `/api/v1/blogs?page=${page}&limit=9`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.data.docs || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Physiotherapy', 'Recovery Tips', 'Success Stories', 'News', 'Health & Wellness', 'Exercise', 'Other'];

  return (
    <>
      <Helmet>
        <title>Blog - BoneBuddy</title>
        <meta name="description" content="Stay updated with the latest news, tips, and insights on physiotherapy and recovery from the BoneBuddy blog." />
        <link rel="canonical" href="https://bonebuddy.com/blog" />
      </Helmet>
      <main className="main-content py-12 pt-24 px-4 sm:px-6 lg:px-8">
        <section id="blog" className="section">
          <h1 className="section-title text-center text-3xl sm:text-4xl">From Our Blog</h1>
          <p className="section-subtitle text-center text-lg sm:text-xl mb-8">
            Stay updated with the latest news, tips, and insights on physiotherapy and recovery.
          </p>

          {/* Category Filter */}
          <div className="max-w-7xl mx-auto mb-8 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm ${
                !selectedCategory 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Posts
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedCategory === category 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading blog posts...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No blog posts available yet. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Blog Posts Grid */}
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {blogs.map(blog => (
                  <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
                    {blog.featuredImage?.url ? (
                      <img 
                        src={blog.featuredImage.url} 
                        alt={blog.title} 
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                        <span className="text-white text-4xl">📝</span>
                      </div>
                    )}
                    <div className="p-6">
                      <span className="text-sm font-semibold text-teal-600">{blog.category}</span>
                      <h3 className="text-xl font-bold my-2 line-clamp-2">{blog.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {blog.excerpt || blog.content.substring(0, 150)}...
                      </p>
                      <div className="flex justify-between items-center">
                        <Link 
                          to={`/blog/${blog.slug}`} 
                          className="font-semibold text-teal-500 hover:text-teal-700"
                        >
                          Read More →
                        </Link>
                        <span className="text-xs text-gray-500">
                          {new Date(blog.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`px-4 py-2 rounded ${
                        page === i + 1 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
};

export default Blog;