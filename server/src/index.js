import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import connectDB from './db/index.js';
import { app } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Server starting...');

// Load environment variables from .env file in server root
// Path is relative to server/ directory (one level up from src/)
dotenv.config({
    path: resolve(__dirname, '../.env')
});

// Verify Razorpay configuration on startup
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️  WARNING: Razorpay credentials not found in environment variables.');
    console.warn('⚠️  Payment features will be disabled.');
    console.warn('⚠️  Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env file.');
} else {
    console.log('✅ Razorpay credentials loaded successfully');
}

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, '0.0.0.0', ()=>{
        console.log(`Server is running at port : ${process.env.PORT || 8000}`);
        
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!! ",err);
})

