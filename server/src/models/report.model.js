import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Report = mongoose.model("Report", reportSchema);

