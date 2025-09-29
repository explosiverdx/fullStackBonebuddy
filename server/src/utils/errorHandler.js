
import { ApiError } from "./ApiError.js";

const errorHandler = (err, req, res, next) => {
    console.error(err);
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
