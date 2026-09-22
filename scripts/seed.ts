import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Admin, Business, Category, Product } from "../models";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/royal_catalogue";

async function seed() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully.");

  // Clear existing collections
  await Promise.all([
    Admin.deleteMany({}),
    Business.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
  ]);
  console.log("Cleared existing database collections.");

  // 1. Create Business: Royal Jewellers
  const business = await Business.create({
    name: "Royal Jewellers",
    slug: "royal-jewellers",
    logo: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=300&q=80",
    description:
      "Purveyors of bespoke high jewellery since 1984. Specializing in ethically sourced natural solitaires, hand-carved heritage temple gold, and heirloom bridal polki.",
    phone: "+91 98765 43210",
    whatsapp: "+919876543210",
    email: "concierge@royaljewellers.com",
    website: "https://royaljewellers.com",
    address: {
      street: "42, Heritage Boulevard, Zaveri Bazaar",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      mapsUrl: "https://maps.google.com/?q=Zaveri+Bazaar+Mumbai",
    },
    socialLinks: {
      instagram: "https://instagram.com/royaljewellers_official",
      facebook: "https://facebook.com/royaljewellers",
      youtube: "https://youtube.com/@royaljewellers",
    },
    branding: {
      primaryColor: "#B4833E",
      secondaryColor: "#141414",
      accentColor: "#D4AF37",
      backgroundColor: "#FAF8F5",
      textColor: "#1C1C1C",
      font: "Playfair Display",
      theme: "luxury",
    },
    catalogueSettings: {
      heroHeading: "Timeless Masterpieces Designed to Celebrate Your Legacy",
      heroSubtitle:
        "Handcrafted 22K hallmarked gold, certified natural solitaires, and heirloom bridal jewels curated for eternity.",
      heroImage:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80",
      heroCtaText: "Explore Collection",
      showAbout: true,
      showContact: true,
      aboutText:
        "Rooted in four decades of uncompromising artistry, Royal Jewellers blends traditional Indian karigari with contemporary avant-garde silhouettes. Every gem is hand-selected and hallmarked to perfection.",
    },
    catalogueStatus: "published",
  });
  console.log(`Created business: ${business.name} (ID: ${business._id})`);

  // 2. Create Admin
  const hashedPassword = await bcrypt.hash("RoyalAdmin@2026", 10);
  const admin = await Admin.create({
    name: "Royal Concierge",
    email: "admin@royaljewellers.com",
    password: hashedPassword,
    role: "admin",
    businessId: business._id,
  });
  console.log(`Created admin: ${admin.email} (Password: RoyalAdmin@2026)`);

  // 3. Create Categories
  const categoryData = [
    {
      name: "Bridal Collection",
      slug: "bridal-collection",
      description: "Heirloom bridal necklaces, mathapattis, and royal adornments for the magnificent bride.",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
      displayOrder: 1,
    },
    {
      name: "Diamond Jewellery",
      slug: "diamond-jewellery",
      description: "Certified GIA natural solitaires and brilliant cut diamond fine jewels.",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
      displayOrder: 2,
    },
    {
      name: "Gold Jewellery",
      slug: "gold-jewellery",
      description: "22-karat BIS hallmarked temple and antique gold designs crafted by master artisans.",
      image: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=800&q=80",
      displayOrder: 3,
    },
    {
      name: "Necklaces",
      slug: "necklaces",
      description: "From delicate layered chokers to cascading multi-tier rani haars.",
      image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80",
      displayOrder: 4,
    },
    {
      name: "Earrings",
      slug: "earrings",
      description: "Chandelier jhumkis, diamond studs, and modern drop earrings.",
      image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
      displayOrder: 5,
    },
    {
      name: "Rings",
      slug: "rings",
      description: "Solitaire engagement rings, eternal bands, and cocktail gemstone rings.",
      image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
      displayOrder: 6,
    },
    {
      name: "Bracelets & Bangles",
      slug: "bracelets-bangles",
      description: "Flexible tennis bracelets, jadau kadas, and openable gold cuffs.",
      image: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=800&q=80",
      displayOrder: 7,
    },
  ];

  const categories = await Category.insertMany(
    categoryData.map((c) => ({
      ...c,
      businessId: business._id,
      isActive: true,
    }))
  );
  console.log(`Created ${categories.length} categories.`);

  // Map slugs to category IDs
  const catMap = new Map(categories.map((c) => [c.slug, c._id]));

  // 4. Create 12+ Realistic Luxury Products with Dynamic Specifications
  const productData = [
    {
      name: "The Imperial Nizam Emerald & Solitaire Necklace",
      slug: "imperial-nizam-emerald-solitaire-necklace",
      sku: "RJ-NC-001",
      categoryId: catMap.get("necklaces"),
      shortDescription: "A breathtaking regal collar set with Zambian emeralds and brilliant cut solitaires.",
      description:
        "Crafted over 180 hours of meticulous hand-setting, the Imperial Nizam necklace features 14.8 carats of natural untreated Zambian emeralds framed by VVS-E clarity diamonds set in 18K white gold.",
      price: 1450000,
      discountPrice: 1320000,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: true,
      isPublished: true,
      tags: ["High Jewellery", "Emerald", "Diamond", "Necklace", "Red Carpet"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80",
          alt: "Imperial Nizam Emerald Necklace Front View",
          isPrimary: true,
          order: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
          alt: "Necklace craftsmanship closeup",
          isPrimary: false,
          order: 1,
        },
      ],
      specifications: [
        { key: "Metal", value: "18K White Gold" },
        { key: "Gross Weight", value: "68.4 grams" },
        { key: "Diamond Weight", value: "9.20 cts" },
        { key: "Diamond Quality", value: "VVS-VS / E-F Color" },
        { key: "Center Gemstone", value: "Natural Zambian Emerald (14.80 cts)" },
        { key: "Certification", value: "IGI & Gubelin Certified" },
      ],
    },
    {
      name: "Eternity Cushion Cut Solitaire Diamond Ring",
      slug: "eternity-cushion-cut-solitaire-diamond-ring",
      sku: "RJ-RG-104",
      categoryId: catMap.get("rings"),
      shortDescription: "A rare 2.50ct cushion modified brilliant solitaire with micro-pave split shank.",
      description:
        "An eternal declaration of love. Features a GIA certified 2.50 carat cushion cut diamond graded D Color and Flawless clarity, elevated upon a platinum cathedral setting lined with French pave diamonds.",
      price: 890000,
      discountPrice: 840000,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: true,
      isPublished: true,
      tags: ["Solitaire", "Engagement Ring", "GIA Certified", "Platinum"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
          alt: "Cushion Cut Solitaire Ring",
          isPrimary: true,
          order: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80",
          alt: "Side view of split shank setting",
          isPrimary: false,
          order: 1,
        },
      ],
      specifications: [
        { key: "Metal", value: "950 Platinum" },
        { key: "Center Solitaire", value: "2.50 Carats" },
        { key: "Cut / Polish / Symmetry", value: "Triple Excellent" },
        { key: "Color & Clarity", value: "D Color / IF (Internally Flawless)" },
        { key: "Side Stones", value: "0.65 cts French Pave" },
        { key: "Lab Certificate", value: "GIA Laser Inscribed" },
      ],
    },
    {
      name: "Maharani Royal Jadau Polki Bridal Choker Set",
      slug: "maharani-royal-jadau-polki-bridal-choker-set",
      sku: "RJ-BD-201",
      categoryId: catMap.get("bridal-collection"),
      shortDescription: "Traditional uncut diamond polki choker accented with south sea pearls and Burmese rubies.",
      description:
        "Fit for royalty, this bridal masterpiece revives centuries-old Bikaner meenakari on the reverse with syndicate uncut polki diamonds and glowing crimson rubies on the front. Accompanied by matching oversized chandbalis.",
      price: 2450000,
      discountPrice: 2280000,
      showPrice: true,
      stockStatus: "made_to_order",
      isFeatured: true,
      isPublished: true,
      tags: ["Bridal", "Polki", "Heritage", "22K Gold", "Uncut Diamonds"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
          alt: "Maharani Bridal Choker and Earrings",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "22K Yellow Gold (Hallmarked 916)" },
        { key: "Gross Weight", value: "142.5 grams" },
        { key: "Polki Weight", value: "32.40 carats (Syndicate Grade)" },
        { key: "Gemstones", value: "Natural Burmese Rubies & Basra Cultured Pearls" },
        { key: "Artistry", value: "Hand-painted Gulabi Meenakari Enameling" },
      ],
    },
    {
      name: "Constellation Cascade Diamond Jhumkis",
      slug: "constellation-cascade-diamond-jhumkis",
      sku: "RJ-ER-303",
      categoryId: catMap.get("earrings"),
      shortDescription: "Dramatic tiered diamond drop jhumkis with detachable floral studs.",
      description:
        "Designed to shimmer with every turn of the head, these chandelier jhumkis merge the traditional bell silhouette with 320 micro-pave and baguette diamonds.",
      price: 520000,
      discountPrice: 480000,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: true,
      isPublished: true,
      tags: ["Earrings", "Jhumki", "Diamond", "Occasion Wear"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80",
          alt: "Constellation Diamond Jhumkis",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "18K Rose Gold" },
        { key: "Gross Weight", value: "28.6 grams" },
        { key: "Diamond Weight", value: "5.80 carats" },
        { key: "Clarity / Color", value: "VS-GH" },
        { key: "Lock Type", value: "South Indian Screw with Safety Clip" },
      ],
    },
    {
      name: "Majestic Heritage Peacock Gold Kadas (Pair)",
      slug: "majestic-heritage-peacock-gold-kadas",
      sku: "RJ-GL-401",
      categoryId: catMap.get("gold-jewellery"),
      shortDescription: "Heirloom 22K antique finish temple bangles sculpted with peacock and floral motifs.",
      description:
        "Hand-beaten and carved using the ancient Nakshi repousse technique. Pair of openable kadas with ruby eyes and filigree screw clasps.",
      price: 680000,
      discountPrice: null,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: false,
      isPublished: true,
      tags: ["Gold", "22K Gold", "Bangles", "Temple Jewellery"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=1200&q=80",
          alt: "Antique Gold Kadas",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Purity", value: "22 Karat (BIS Hallmarked 916)" },
        { key: "Gross Weight", value: "84.20 grams (Pair)" },
        { key: "Craft", value: "Nakshi Temple Sculpture" },
        { key: "Accent Stones", value: "Natural Pink Tourmalines" },
        { key: "Clasp", value: "Screw Closure" },
      ],
    },
    {
      name: "Starlight Flexible Diamond Tennis Bracelet",
      slug: "starlight-flexible-diamond-tennis-bracelet",
      sku: "RJ-BR-502",
      categoryId: catMap.get("bracelets-bangles"),
      shortDescription: "Fluid continuous line of 55 matching round brilliant ideal-cut diamonds.",
      description:
        "The quintessential luxury statement. Each stone is individually four-prong set in 18K white gold with a double safety box catch.",
      price: 495000,
      discountPrice: 450000,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: true,
      isPublished: true,
      tags: ["Diamond", "Tennis Bracelet", "Classic", "18K Gold"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=1200&q=80",
          alt: "Diamond Tennis Bracelet",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "18K White Gold" },
        { key: "Total Diamond Weight", value: "6.50 cts" },
        { key: "Diamond Cut", value: "Hearts & Arrows Round Brilliant" },
        { key: "Diamond Quality", value: "VVS-VS / F-G" },
        { key: "Length", value: "7.0 inches" },
      ],
    },
    {
      name: "Aura Tanzanite & Pear Diamond Halo Ring",
      slug: "aura-tanzanite-pear-diamond-halo-ring",
      sku: "RJ-RG-605",
      categoryId: catMap.get("rings"),
      shortDescription: "Vibrant royal violet-blue tanzanite encompassed by scintillating pear cut diamonds.",
      description:
        "Centering an intense 4.20 carat cushion tanzanite sourced from the foothills of Mount Kilimanjaro, embraced by a constellation of pear-shaped solitaire halos.",
      price: 380000,
      discountPrice: 350000,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: false,
      isPublished: true,
      tags: ["Tanzanite", "Gemstone Ring", "Diamond", "Cocktail Ring"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80",
          alt: "Tanzanite and Diamond Ring",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "18K Yellow & White Gold" },
        { key: "Center Gemstone", value: "Natural Tanzanite (4.20 carats)" },
        { key: "Color Grade", value: "Vivid Violetish Blue (AAA)" },
        { key: "Diamond Accent", value: "1.45 cts Pear & Round" },
        { key: "Size", value: "54 EU / 7 US (Resizable)" },
      ],
    },
    {
      name: "Serenade Marquise Floral Diamond Necklace",
      slug: "serenade-marquise-floral-diamond-necklace",
      sku: "RJ-NC-707",
      categoryId: catMap.get("necklaces"),
      shortDescription: "Delicate garland of marquise and round diamonds designed like blooming jasmine petals.",
      description:
        "Crafted for modern brides and black-tie galas. Graceful floral clusters gracefully graduate around the neckline, casting supreme fire and scintillation.",
      price: 1150000,
      discountPrice: null,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: true,
      isPublished: true,
      tags: ["Diamond", "Necklace", "Marquise", "Contemporary Bridal"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80",
          alt: "Marquise Floral Diamond Necklace",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "18K White Gold" },
        { key: "Diamond Weight", value: "11.25 cts" },
        { key: "Gross Weight", value: "52.8 grams" },
        { key: "Stone Shapes", value: "Marquise & Round Brilliant" },
        { key: "Clarity", value: "VVS-VS" },
      ],
    },
    {
      name: "Navratna Heritage Temple Mathapatti",
      slug: "navratna-heritage-temple-mathapatti",
      sku: "RJ-BD-808",
      categoryId: catMap.get("bridal-collection"),
      shortDescription: "Auspicious nine-gem bridal forehead ornament with cascading pearls.",
      description:
        "A sacred jewel of celestial harmony. Handcrafted in 22K hallmarked gold featuring ruby, pearl, coral, emerald, yellow sapphire, diamond, blue sapphire, hessonite, and cat's eye.",
      price: 740000,
      discountPrice: 699000,
      showPrice: true,
      stockStatus: "made_to_order",
      isFeatured: false,
      isPublished: true,
      tags: ["Navratna", "Mathapatti", "Bridal", "Temple Gold"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
          alt: "Navratna Mathapatti",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "22K Gold (916 BIS)" },
        { key: "Gross Weight", value: "64.0 grams" },
        { key: "Gems", value: "Authentic Navratna 9 Planetary Gems" },
        { key: "Pearl Stringing", value: "Natural Basra Pearls" },
      ],
    },
    {
      name: "Sovereign Solitaire Emerald Cut Studs",
      slug: "sovereign-solitaire-emerald-cut-studs",
      sku: "RJ-ER-909",
      categoryId: catMap.get("diamond-jewellery"),
      shortDescription: "Matched pair of 1.00ct emerald cut natural diamond earrings in platinum.",
      description:
        "The epitome of understated elegance. Two matched emerald cut diamonds (2.02 carats total) displaying hall-of-mirrors reflection in four-corner prongs.",
      price: 430000,
      discountPrice: 395000,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: false,
      isPublished: true,
      tags: ["Solitaire", "Emerald Cut", "Diamond Studs", "Platinum"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80",
          alt: "Emerald Cut Diamond Studs",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "950 Platinum" },
        { key: "Total Carats", value: "2.02 cts (1.01 ct each)" },
        { key: "Color", value: "E Color" },
        { key: "Clarity", value: "VVS1" },
        { key: "Certificate", value: "Dual GIA Dossiers" },
      ],
    },
    {
      name: "Devi 22K Antique Lakshmi Coin Haaram",
      slug: "devi-22k-antique-lakshmi-coin-haaram",
      sku: "RJ-GL-910",
      categoryId: catMap.get("gold-jewellery"),
      shortDescription: "Traditional long Kasu Mala engraved with Goddess Lakshmi motifs.",
      description:
        "Worn as a symbol of abundance and divine grace, this 32-inch heritage long haaram features 48 hand-stamped gold coins joined with ruby florets.",
      price: 920000,
      discountPrice: 880000,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: false,
      isPublished: true,
      tags: ["Kasu Mala", "Lakshmi Coin", "Gold Haaram", "22K Gold"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=1200&q=80",
          alt: "Lakshmi Coin Haaram",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "22 Karat Yellow Gold" },
        { key: "Gross Weight", value: "110.5 grams" },
        { key: "Length", value: "32 Inches" },
        { key: "Stones", value: "Cabochon Rubies" },
      ],
    },
    {
      name: "Celestial Sapphire & Diamond Cocktail Ring",
      slug: "celestial-sapphire-diamond-cocktail-ring",
      sku: "RJ-RG-911",
      categoryId: catMap.get("rings"),
      shortDescription: "Unheated Ceylon royal blue sapphire crowned with tapered baguette diamonds.",
      description:
        "A true collector's gemstone. An exceptional 5.15ct unheated Ceylon sapphire boasting deep velvety blue saturation, complemented by a geometric art deco diamond halo.",
      price: 760000,
      discountPrice: null,
      showPrice: true,
      stockStatus: "in_stock",
      isFeatured: false,
      isPublished: true,
      tags: ["Ceylon Sapphire", "Art Deco", "Cocktail Ring", "High Jewellery"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80",
          alt: "Ceylon Sapphire Cocktail Ring",
          isPrimary: true,
          order: 0,
        },
      ],
      specifications: [
        { key: "Metal", value: "18K White Gold" },
        { key: "Center Gem", value: "5.15 ct Natural Unheated Sapphire (Ceylon)" },
        { key: "Diamond Accents", value: "1.80 cts Baguette & Brilliant" },
        { key: "Certification", value: "SSEF & GRS Certified" },
      ],
    },
  ];

  await Product.insertMany(
    productData.map((p) => ({
      ...p,
      businessId: business._id,
    }))
  );
  console.log(`Created ${productData.length} luxury products.`);

  console.log("\n========================================================");
  console.log("Seeding Complete!");
  console.log(`Store URL:        http://localhost:3000/store/${business.slug}`);
  console.log(`Admin Login:      http://localhost:3000/admin/login`);
  console.log(`Admin Email:      admin@royaljewellers.com`);
  console.log(`Admin Password:   RoyalAdmin@2026`);
  console.log("========================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
