export type Role = "admin" | "superadmin";

export type StockStatus = "in_stock" | "out_of_stock" | "made_to_order";

export type CatalogueStatus = "published" | "unpublished";

export type CatalogueTheme = "luxury" | "modern" | "classic" | "minimal";

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  mapsUrl?: string;
}

export interface ISocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export interface IBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  theme: CatalogueTheme;
}

export interface ICatalogueSettings {
  heroHeading: string;
  heroSubtitle: string;
  heroImage: string;
  heroCtaText: string;
  showAbout: boolean;
  showContact: boolean;
  aboutText?: string;
}

export interface IBusiness {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  phone?: string;
  whatsapp: string;
  email?: string;
  website?: string;
  address?: IAddress;
  socialLinks?: ISocialLinks;
  branding: IBranding;
  catalogueSettings: ICatalogueSettings;
  catalogueStatus: CatalogueStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IAdmin {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  businessId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICategory {
  _id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  order?: number;
}

export interface IProductSpecification {
  key: string;
  value: string;
}

export interface IProduct {
  _id: string;
  businessId: string;
  categoryId: string;
  category?: ICategory;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  showPrice: boolean;
  stockStatus: StockStatus;
  images: IProductImage[];
  specifications: IProductSpecification[];
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalCategories: number;
  catalogueStatus: CatalogueStatus;
  businessName: string;
  businessSlug: string;
  lastUpdated: string | Date;
}
