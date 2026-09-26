import mongoose, { Schema, Model } from "mongoose";

export interface IProductImageDoc {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  order?: number;
}

export interface IProductSpecificationDoc {
  key: string;
  value: string;
}

export interface IProductDocument extends mongoose.Document {
  businessId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  showPrice: boolean;
  quantity: number;
  stockStatus: "in_stock" | "out_of_stock" | "made_to_order";
  images: IProductImageDoc[];
  specifications: IProductSpecificationDoc[];
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImageDoc>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSpecificationSchema = new Schema<IProductSpecificationDoc>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProductDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    sku: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null },
    showPrice: { type: Boolean, default: true },
    quantity: { type: Number, default: 10, min: 0 },
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "made_to_order"],
      default: "in_stock",
    },
    images: { type: [ProductImageSchema], default: [] },
    specifications: { type: [ProductSpecificationSchema], default: [] },
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ businessId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ businessId: 1, sku: 1 });
ProductSchema.index({ businessId: 1, isPublished: 1, isFeatured: 1 });

export const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
