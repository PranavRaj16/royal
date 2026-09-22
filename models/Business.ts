import mongoose, { Schema, Model } from "mongoose";

export interface IBusinessDocument extends mongoose.Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  phone?: string;
  whatsapp: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    mapsUrl?: string;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor?: string;
    textColor?: string;
    font?: string;
    theme: "luxury" | "modern" | "classic" | "minimal";
  };
  catalogueSettings: {
    heroHeading: string;
    heroSubtitle: string;
    heroImage: string;
    heroCtaText: string;
    showAbout: boolean;
    showContact: boolean;
    aboutText?: string;
  };
  catalogueStatus: "published" | "unpublished";
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusinessDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logo: { type: String, default: "" },
    description: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    website: { type: String, default: "" },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "India" },
      mapsUrl: { type: String, default: "" },
    },
    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    branding: {
      primaryColor: { type: String, default: "#B4833E" }, // Warm Luxury Gold
      secondaryColor: { type: String, default: "#1A1A1A" }, // Deep Charcoal
      accentColor: { type: String, default: "#D4AF37" }, // Brilliant Gold
      backgroundColor: { type: String, default: "#FAF8F5" }, // Off-white ivory
      textColor: { type: String, default: "#1F1F1F" },
      font: { type: String, default: "Playfair Display" },
      theme: {
        type: String,
        enum: ["luxury", "modern", "classic", "minimal"],
        default: "luxury",
      },
    },
    catalogueSettings: {
      heroHeading: {
        type: String,
        default: "Timeless Jewellery Designed to Celebrate Every Moment",
      },
      heroSubtitle: {
        type: String,
        default: "Discover handcrafted gold, certified solitaires, and heirloom bridal collections.",
      },
      heroImage: {
        type: String,
        default: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80",
      },
      heroCtaText: { type: String, default: "Explore Collections" },
      showAbout: { type: Boolean, default: true },
      showContact: { type: Boolean, default: true },
      aboutText: {
        type: String,
        default: "With decades of artisanal craftsmanship, Royal Jewellers curates peerless purity and unmatched designs.",
      },
    },
    catalogueStatus: {
      type: String,
      enum: ["published", "unpublished"],
      default: "published",
    },
  },
  { timestamps: true }
);

export const Business: Model<IBusinessDocument> =
  mongoose.models.Business || mongoose.model<IBusinessDocument>("Business", BusinessSchema);

export default Business;
