import { Router } from "express";
import {
    createBlogPost,
    getAllBlogPosts,
    getBlogPost,
    updateBlogPost,
    deleteBlogPost,
    likeBlogPost,
    getBlogStats,
} from "../controllers/blog.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyPermission } from "../middleware/permission.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllBlogPosts); // Get all published blogs
router.route("/:slugOrId").get(getBlogPost); // Get single blog
router.route("/:id/like").post(likeBlogPost); // Like a blog post

// Admin routes
router.route("/admin/create").post(
    verifyJWT, 
    verifyPermission(['admin']), 
    upload.single('featuredImage'), 
    createBlogPost
);

router.route("/admin/all").get(
    verifyJWT, 
    verifyPermission(['admin']), 
    getAllBlogPosts
); // Get all blogs (including drafts)

router.route("/admin/stats").get(
    verifyJWT, 
    verifyPermission(['admin']), 
    getBlogStats
);

router.route("/admin/:id")
    .patch(verifyJWT, verifyPermission(['admin']), upload.single('featuredImage'), updateBlogPost)
    .delete(verifyJWT, verifyPermission(['admin']), deleteBlogPost);

export default router;



