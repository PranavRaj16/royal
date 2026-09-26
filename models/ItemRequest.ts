import mongoose, { Schema, Model } from "mongoose";

export interface IItemRequestDocument extends mongoose.Document {
  businessId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  productName: string;
  productSku?: string;
  visitorName: string;
  visitorPhone: string;
  quantity: number;
  description?: string;
  status: "pending" | "contacted" | "fulfilled" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const ItemRequestSchema = new Schema<IItemRequestDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", default: null, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, required: true, trim: true },
    productSku: { type: String, default: "" },
    visitorName: { type: String, required: true, trim: true },
    visitorPhone: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "contacted", "fulfilled", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

ItemRequestSchema.index({ businessId: 1, createdAt: -1 });

export const ItemRequest: Model<IItemRequestDocument> =
  mongoose.models.ItemRequest ||
  mongoose.model<IItemRequestDocument>("ItemRequest", ItemRequestSchema);

export default ItemRequest;
