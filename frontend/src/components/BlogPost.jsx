import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    fetchBlogPost();
  }, [slug]);

  const fetchBlogPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/blogs/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setBlog(data.data);
        
        // Fetch related posts from same category
        if (data.data.category) {
          fetchRelatedPosts(data.data.category, data.data._id);
        }
      } else {
        console.error('Blog post not found');
        navigate('/blog');
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (category, currentId) => {
    try {
      const response = await fetch(`/api/v1/blogs?category=${category}&limit=3`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current post
        const related = (data.data.docs || []).filter(post => post._id !== currentId);
        setRelatedPosts(related.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  const handleLike = async () => {
    if (!blog) return;
    try {
      const response = await fetch(`/api/v1/blogs/${blog._id}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        setBlog(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog post not found</h2>
          <button
            onClick={() => navigate('/blog')}
            className="text-teal-600 hover:text-teal-700 font-semibold"
          >
            ← Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{blog.metaTitle || blog.title} - BoneBuddy</title>
        <meta name="description" content={blog.metaDescription || blog.excerpt} />
        <link rel="canonical" href={`https://bonebuddy.com/blog/${blog.slug}`} />
      </Helmet>

      <main className="main-content py-12 pt-24 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/blog')}
            className="text-teal-600 hover:text-teal-700 font-semibold mb-6 flex items-center gap-2"
          >
            <span>←</span> Back to Blog
          </button>

          {/* Featured Image */}
          {blog.featuredImage?.url && (
            <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
              <img
                src={blog.featuredImage.url}
                alt={blog.title}
                className="w-full h-64 sm:h-96 object-cover"
              />
            </div>
          )}

          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-block bg-teal-100 text-teal-800 text-sm font-semibold px-3 py-1 rounded-full">
              {blog.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {blog.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{new Date(blog.publishedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👁️</span>
              <span>{blog.views || 0} views</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 hover:text-teal-600 transition-colors"
              >
                <span>❤️</span>
                <span>{blog.likes || 0} likes</span>
              </button>
            </div>
          </div>

          {/* Excerpt */}
          {blog.excerpt && (
            <div className="bg-gray-50 border-l-4 border-teal-600 p-6 mb-8 rounded-r-lg">
              <p className="text-lg text-gray-700 italic">{blog.excerpt}</p>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {blog.content}
            </div>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mb-12 pb-8 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Info */}
          {blog.author && (
            <div className="bg-teal-50 rounded-lg p-6 mb-12">
              <div className="flex items-center gap-4">
                {blog.author.avatar ? (
                  <img
                    src={blog.author.avatar}
                    alt={blog.author.Fullname || 'Author'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-teal-600"
                  />
                ) : (
                  <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {blog.author.Fullname?.charAt(0) || 'A'}
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Written by</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {blog.author.Fullname || 'Admin'}
                  </p>
                  {blog.author.email && (
                    <p className="text-xs text-gray-500 mt-1">{blog.author.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this post:</h3>
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Facebook
              </button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${blog.title}`, '_blank')}
                className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 transition-colors"
              >
                Twitter
              </button>
              <button
                onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}&title=${blog.title}`, '_blank')}
                className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
              >
                LinkedIn
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-6xl mx-auto mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(post => (
                <div
                  key={post._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => {
                    navigate(`/blog/${post.slug}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {post.featuredImage?.url ? (
                    <img
                      src={post.featuredImage.url}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                      <span className="text-white text-4xl">📝</span>
                    </div>
                  )}
                  <div className="p-4">
                    <span className="text-xs font-semibold text-teal-600">{post.category}</span>
                    <h3 className="text-lg font-bold my-2 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                    <div className="mt-3 text-teal-500 hover:text-teal-700 font-semibold text-sm">
                      Read More →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default BlogPost;

