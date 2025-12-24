import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Blog } from "../models/blog.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * Create a new blog post (Admin only)
 */
const createBlogPost = asyncHandler(async (req, res) => {
    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can create blog posts.");
    }

    console.log('📝 Blog creation request received:', {
        hasFile: !!req.file,
        fileInfo: req.file ? {
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        } : 'No file'
    });

    const { title, content, excerpt, category, tags, status, metaTitle, metaDescription } = req.body;

    if (!title || !content) {
        throw new ApiError(400, "Title and content are required.");
    }

    // Handle featured image upload if provided
    let featuredImage = null;
    if (req.file) {
        console.log('📸 Blog image upload started:', {
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Check if file exists before uploading
        const fs = await import('fs');
        if (!fs.existsSync(req.file.path)) {
            console.error('❌ File does not exist at path:', req.file.path);
            throw new ApiError(400, "Uploaded file not found. Please try uploading again.");
        }

        const imageResult = await uploadOnCloudinary(req.file.path);
        
        if (!imageResult) {
            console.error('❌ Cloudinary upload failed for blog image');
            console.error('   File path:', req.file.path);
            console.error('   File size:', req.file.size);
            console.error('   File mimetype:', req.file.mimetype);
            throw new ApiError(500, "Failed to upload image to Cloudinary. Please check server logs for details. Common issues: invalid Cloudinary credentials, network connectivity, or file size limits.");
        }

        console.log('✅ Blog image uploaded successfully:', imageResult.secure_url || imageResult.url);
        
        // Always use secure_url (HTTPS) for images to prevent mixed content issues
        const imageUrl = imageResult.secure_url || imageResult.url;
        // Ensure HTTPS even if secure_url is not available
        const httpsUrl = imageUrl?.startsWith('http://') 
            ? imageUrl.replace('http://', 'https://') 
            : imageUrl;
        featuredImage = {
            url: httpsUrl,
            publicId: imageResult.public_id,
        };
    }

    // Parse tags if it's a string
    const tagArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags || [];

    const blog = await Blog.create({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        featuredImage,
        author: req.user._id,
        category: category || 'Other',
        tags: tagArray,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || content.substring(0, 160),
    });

    return res.status(201).json(
        new ApiResponse(201, blog, "Blog post created successfully.")
    );
});

/**
 * Get all blog posts (with pagination and filters)
 */
const getAllBlogPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, category, search } = req.query;

    const match = {};
    
    // Public users only see published posts
    if (req.user?.userType !== 'admin') {
        match.status = 'published';
    } else if (status) {
        match.status = status;
    }

    if (category) {
        match.category = category;
    }

    if (search) {
        match.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { tags: { $regex: search, $options: 'i' } },
        ];
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: { path: 'author', select: 'Fullname email' },
    };

    const aggregate = Blog.aggregate([
        { $match: match },
        {
            $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'author',
            },
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                title: 1,
                slug: 1,
                excerpt: 1,
                content: 1,
                featuredImage: 1,
                author: { Fullname: 1, email: 1, avatar: 1 },
                category: 1,
                tags: 1,
                status: 1,
                publishedAt: 1,
                views: 1,
                likes: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
        { $sort: { createdAt: -1 } },
    ]);

    const blogs = await Blog.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, blogs, "Blog posts retrieved successfully.")
    );
});

/**
 * Get single blog post by slug or ID
 */
const getBlogPost = asyncHandler(async (req, res) => {
    const { slugOrId } = req.params;

    let blog;
    
    // Try to find by slug first, then by ID
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
        blog = await Blog.findById(slugOrId).populate('author', 'Fullname email avatar');
    } else {
        blog = await Blog.findOne({ slug: slugOrId }).populate('author', 'Fullname email avatar');
    }

    console.log('📝 Blog found:', blog?.title);
    console.log('👤 Author data:', blog?.author);

    if (!blog) {
        throw new ApiError(404, "Blog post not found.");
    }

    // Only show published posts to non-admins
    if (blog.status !== 'published' && req.user?.userType !== 'admin') {
        throw new ApiError(404, "Blog post not found.");
    }

    // Increment view count (but not for admins)
    if (req.user?.userType !== 'admin') {
        blog.views += 1;
        await blog.save();
    }

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog post retrieved successfully.")
    );
});

/**
 * Update blog post (Admin only)
 */
const updateBlogPost = asyncHandler(async (req, res) => {
    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can update blog posts.");
    }

    const { id } = req.params;
    const { title, content, excerpt, category, tags, status, metaTitle, metaDescription } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog post not found.");
    }

    // Handle featured image upload if provided
    if (req.file) {
        console.log('📸 Blog image update upload started:', {
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Check if file exists before uploading
        const fs = await import('fs');
        if (!fs.existsSync(req.file.path)) {
            console.error('❌ File does not exist at path:', req.file.path);
            throw new ApiError(400, "Uploaded file not found. Please try uploading again.");
        }

        const imageResult = await uploadOnCloudinary(req.file.path);
        
        if (!imageResult) {
            console.error('❌ Cloudinary upload failed for blog image update');
            throw new ApiError(500, "Failed to upload image to Cloudinary. Please check server logs and Cloudinary configuration.");
        }

        console.log('✅ Blog image updated successfully:', imageResult.secure_url || imageResult.url);
        
        // Always use secure_url (HTTPS) for images to prevent mixed content issues
        const imageUrl = imageResult.secure_url || imageResult.url;
        // Ensure HTTPS even if secure_url is not available
        const httpsUrl = imageUrl?.startsWith('http://') 
            ? imageUrl.replace('http://', 'https://') 
            : imageUrl;
        blog.featuredImage = {
            url: httpsUrl,
            publicId: imageResult.public_id,
        };
    }

    // Update fields
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (excerpt) blog.excerpt = excerpt;
    if (category) blog.category = category;
    if (tags) blog.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags;
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;

    // Update status and publish date
    if (status) {
        const wasPublished = blog.status === 'published';
        blog.status = status;
        
        // Set publishedAt when first publishing
        if (status === 'published' && !wasPublished) {
            blog.publishedAt = new Date();
        }
    }

    await blog.save();

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog post updated successfully.")
    );
});

/**
 * Delete blog post (Admin only)
 */
const deleteBlogPost = asyncHandler(async (req, res) => {
    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can delete blog posts.");
    }

    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
        throw new ApiError(404, "Blog post not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Blog post deleted successfully.")
    );
});

/**
 * Toggle blog post like (Public)
 */
const likeBlogPost = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog post not found.");
    }

    if (blog.status !== 'published') {
        throw new ApiError(404, "Blog post not found.");
    }

    blog.likes += 1;
    await blog.save();

    return res.status(200).json(
        new ApiResponse(200, { likes: blog.likes }, "Blog post liked successfully.")
    );
});

/**
 * Get blog categories and stats
 */
const getBlogStats = asyncHandler(async (req, res) => {
    const stats = await Blog.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const categoryStats = await Blog.aggregate([
        {
            $match: { status: 'published' },
        },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
            },
        },
    ]);

    const totalViews = await Blog.aggregate([
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' },
                totalLikes: { $sum: '$likes' },
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            statusStats: stats,
            categoryStats,
            totalViews: totalViews[0]?.totalViews || 0,
            totalLikes: totalViews[0]?.totalLikes || 0,
        }, "Blog statistics retrieved successfully.")
    );
});

export {
    createBlogPost,
    getAllBlogPosts,
    getBlogPost,
    updateBlogPost,
    deleteBlogPost,
    likeBlogPost,
    getBlogStats,
};

