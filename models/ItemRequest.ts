import mongoose, { Schema, Model } from "mongoose";

export interface IItemRequestDocument extends mongoose.Document {
  businessId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  productName: string;
  productSku?: string;
  productImage?: string;
  visitorName: string;
  visitorPhone: string;
  quantity: number;
  description?: string;
  status: "pending" | "contacted" | "in-progress" | "fulfilled" | "cancelled";
  isQuantityDeducted?: boolean;
  orderId?: string;
  source?: "whatsapp" | "order" | "quick-request" | "cart";
  isWhatsAppEnquiry?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemRequestSchema = new Schema<IItemRequestDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", default: null, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, required: true, trim: true },
    productSku: { type: String, default: "" },
    productImage: { type: String, default: "" },
    visitorName: { type: String, required: true, trim: true },
    visitorPhone: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "contacted", "in-progress", "fulfilled", "cancelled"],
      default: "pending",
      index: true,
    },
    isQuantityDeducted: { type: Boolean, default: false },
    orderId: { type: String, default: null, index: true },
    source: {
      type: String,
      enum: ["whatsapp", "order", "quick-request", "cart"],
      default: "order",
      index: true,
    },
    isWhatsAppEnquiry: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ItemRequestSchema.index({ businessId: 1, createdAt: -1 });

// Delete cached model to ensure schema changes (like new fields) always take effect.
// Without this, Next.js hot-reload reuses the old compiled schema and silently drops new fields.
if (mongoose.models.ItemRequest) {
  delete (mongoose.models as Record<string, unknown>).ItemRequest;
}

export const ItemRequest: Model<IItemRequestDocument> =
  mongoose.model<IItemRequestDocument>("ItemRequest", ItemRequestSchema);

export default ItemRequest;
