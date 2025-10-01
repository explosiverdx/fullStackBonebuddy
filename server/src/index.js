// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js';

console.log('Server starting...');

dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, '0.0.0.0', ()=>{
        console.log(`Server is running at port : ${process.env.PORT || 8000}`);
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!! ",err);
})

