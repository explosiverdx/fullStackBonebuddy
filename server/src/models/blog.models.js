import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false, // Auto-generated in pre-save hook
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: false,
      maxlength: 300,
    },
    featuredImage: {
      url: {
        type: String,
        required: false,
      },
      publicId: {
        type: String,
        required: false,
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['Physiotherapy', 'Recovery Tips', 'Success Stories', 'News', 'Health & Wellness', 'Exercise', 'Other'],
      default: 'Other',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      required: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    metaTitle: {
      type: String,
      required: false,
    },
    metaDescription: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Create slug from title before saving
blogSchema.pre('save', async function(next) {
  try {
    if (this.isModified('title') || !this.slug) {
      // Generate base slug from title
      let baseSlug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Ensure unique slug
      let counter = 0;
      let uniqueSlug = baseSlug;
      
      // Check if slug already exists (excluding current document)
      const existingBlog = await mongoose.models.Blog.findOne({ 
        slug: uniqueSlug, 
        _id: { $ne: this._id } 
      });
      
      if (existingBlog) {
        // Keep incrementing counter until we find a unique slug
        while (await mongoose.models.Blog.findOne({ slug: uniqueSlug, _id: { $ne: this._id } })) {
          counter++;
          uniqueSlug = `${baseSlug}-${counter}`;
        }
      }
      
      this.slug = uniqueSlug;
    }
    next();
  } catch (error) {
    next(error);
  }
});

blogSchema.plugin(mongooseAggregatePaginate);

export const Blog = mongoose.model('Blog', blogSchema);



