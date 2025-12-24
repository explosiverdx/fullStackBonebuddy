import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express()

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}))

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true ,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from './routes/user.routes.js'
import doctorRouter from './routes/doctor.routes.js'
import patientRouter from './routes/patient.routes.js'
import appointmentRouter from './routes/appointment.routes.js'
import medicalRecordRouter from './routes/medical_record.routes.js'
import physioRouter from './routes/physio.routes.js'
import progressReportRouter from './routes/progressreport.routes.js'
import paymentRouter from './routes/payment.routes.js'
import hospitalRouter from './routes/hospital.routes.js'
import serviceRouter from './routes/service.routes.js'
import rbacRouter from './routes/rbac.routes.js'
import sessionRouter from './routes/session.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import adminRouter from './routes/admin.routes.js'

import { errorHandler } from './utils/errorHandler.js';

// routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/doctors", doctorRouter)
app.use("/api/v1/patients", patientRouter)
app.use("/api/v1/appointments", appointmentRouter)
app.use("/api/v1/medical-records", medicalRecordRouter)
app.use("/api/v1/physios", physioRouter)
app.use("/api/v1/progress-reports", progressReportRouter)
app.use("/api/v1/payments", paymentRouter)
app.use("/api/v1/hospitals", hospitalRouter)
app.use("/api/v1/services", serviceRouter)
app.use("/api/v1/rbac", rbacRouter)
app.use("/api/v1/sessions", sessionRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/admin", adminRouter)

app.use(errorHandler);

export {app}
