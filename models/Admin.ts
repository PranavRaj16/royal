import mongoose, { Schema, Model } from "mongoose";

export interface IAdminDocument extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "superadmin";
  businessId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdminDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
  },
  { timestamps: true }
);

export const Admin: Model<IAdminDocument> =
  mongoose.models.Admin || mongoose.model<IAdminDocument>("Admin", AdminSchema);

export default Admin;
