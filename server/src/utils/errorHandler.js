
import { ApiError } from "./ApiError.js";

const errorHandler = (err, req, res, next) => {
    // Don't log 401 (Unauthorized) errors as errors - they're expected for unauthenticated requests
    if (err instanceof ApiError && err.statusCode === 401) {
        // Only log at debug level, not as error
        console.log(`[401] ${req.method} ${req.path} - ${err.message}`);
    } else {
        // Log all other errors
        console.error(`[${err.statusCode || 500}] ${req.method} ${req.path}`, err);
    }
    
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    } else {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export { errorHandler };
