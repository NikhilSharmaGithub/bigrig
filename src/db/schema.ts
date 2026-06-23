import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const userRole = pgEnum("user_role", ["customer", "pro", "admin"]);
export const vendorStatus = pgEnum("vendor_status", [
  "pending",
  "approved",
  "suspended",
]);
export const payoutStatus = pgEnum("payout_status", [
  "pending",
  "paid",
  "failed",
]);
export const couponType = pgEnum("coupon_type", ["percent", "fixed"]);
export const addressType = pgEnum("address_type", ["shipping", "billing"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export const returnStatus = pgEnum("return_status", [
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
]);

/* -------------------------------------------------------------------------- */
/*  Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    blurb: text("blurb"),
    parentId: uuid("parent_id"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    partNumber: text("part_number").notNull(),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    // Null = first-party / house product; set = listed by a marketplace vendor.
    vendorId: uuid("vendor_id").references(() => vendors.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    // "About this item" bullet points (newline-separated).
    highlights: text("highlights"),
    // SEO: comma-separated keywords + optional meta overrides for Google.
    keywords: text("keywords"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    // Money stored as integer cents to avoid floating-point error.
    priceCents: integer("price_cents").notNull(),
    listPriceCents: integer("list_price_cents"),
    weightOz: integer("weight_oz"),
    ratingAvg: numeric("rating_avg", { precision: 2, scale: 1 })
      .notNull()
      .default("0"),
    ratingCount: integer("rating_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("products_brand_idx").on(t.brandId),
    index("products_category_idx").on(t.categoryId),
    index("products_part_number_idx").on(t.partNumber),
    index("products_vendor_idx").on(t.vendorId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productSpecs = pgTable(
  "product_specs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    value: text("value").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_specs_product_idx").on(t.productId)],
);

export const inventory = pgTable("inventory", {
  productId: uuid("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  warehouse: text("warehouse"),
  restockEta: timestamp("restock_eta", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Vehicles & fitment                                                         */
/* -------------------------------------------------------------------------- */

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    yearStart: integer("year_start"),
    yearEnd: integer("year_end"),
  },
  (t) => [
    unique("vehicles_make_model_years_unq").on(
      t.make,
      t.model,
      t.yearStart,
      t.yearEnd,
    ),
    index("vehicles_make_idx").on(t.make),
  ],
);

export const productFitment = pgTable(
  "product_fitment",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    note: text("note"),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.vehicleId] }),
    index("product_fitment_vehicle_idx").on(t.vehicleId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Users & addresses                                                          */
/* -------------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  role: userRole("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    storeName: text("store_name").notNull(),
    slug: text("slug").notNull().unique(),
    bio: text("bio"),
    status: vendorStatus("status").notNull().default("approved"),
    // Stripe Connect (Express) account for vendor payouts.
    stripeAccountId: text("stripe_account_id"),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("vendors_status_idx").on(t.status)],
);

/** Singleton row of platform-wide settings (commission rate, etc.). */
export const platformSettings = pgTable("platform_settings", {
  id: integer("id").primaryKey().default(1),
  commissionBps: integer("commission_bps").notNull().default(1000), // 10%
  taxBps: integer("tax_bps").notNull().default(0), // sales tax rate
  flatShippingCents: integer("flat_shipping_cents").notNull().default(1500),
  freeShipThresholdCents: integer("free_ship_threshold_cents")
    .notNull()
    .default(9900),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const vendorPayouts = pgTable(
  "vendor_payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    status: payoutStatus("status").notNull().default("pending"),
    stripeTransferId: text("stripe_transfer_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("vendor_payouts_vendor_idx").on(t.vendorId)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: addressType("type").notNull().default("shipping"),
    fullName: text("full_name").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("US"),
    phone: text("phone"),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

/* -------------------------------------------------------------------------- */
/*  Cart                                                                       */
/* -------------------------------------------------------------------------- */

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    // For guests: opaque session identifier stored in a cookie.
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("carts_user_idx").on(t.userId),
    index("carts_session_idx").on(t.sessionId),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => [unique("cart_items_cart_product_unq").on(t.cartId, t.productId)],
);

/* -------------------------------------------------------------------------- */
/*  Orders                                                                     */
/* -------------------------------------------------------------------------- */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: orderStatus("status").notNull().default("pending"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    couponCode: text("coupon_code"),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    // Snapshot of the shipping address at purchase time.
    shippingAddress: jsonb("shipping_address"),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntent: text("stripe_payment_intent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    // Snapshots so line items survive product edits/deletes.
    name: text("name").notNull(),
    partNumber: text("part_number").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/* -------------------------------------------------------------------------- */
/*  Returns / RMA                                                              */
/* -------------------------------------------------------------------------- */

export const returns = pgTable(
  "returns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rmaNumber: text("rma_number").notNull().unique(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: returnStatus("status").notNull().default("requested"),
    reason: text("reason"),
    refundCents: integer("refund_cents"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("returns_order_idx").on(t.orderId)],
);

/* -------------------------------------------------------------------------- */
/*  My Garage (saved vehicles)                                                  */
/* -------------------------------------------------------------------------- */

export const garageVehicles = pgTable(
  "garage_vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("garage_user_vehicle_unq").on(t.userId, t.vehicleId),
    index("garage_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Product Q&A                                                                 */
/* -------------------------------------------------------------------------- */

export const productQuestions = pgTable(
  "product_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    question: text("question").notNull(),
    answer: text("answer"),
    answeredBy: text("answered_by"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("product_questions_product_idx").on(t.productId)],
);

/* -------------------------------------------------------------------------- */
/*  Wishlist                                                                    */
/* -------------------------------------------------------------------------- */

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("wishlist_user_product_unq").on(t.userId, t.productId),
    index("wishlist_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                     */
/* -------------------------------------------------------------------------- */

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(), // 1–5
    title: text("title"),
    body: text("body"),
    verifiedPurchase: boolean("verified_purchase").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

/* -------------------------------------------------------------------------- */
/*  Coupons                                                                     */
/* -------------------------------------------------------------------------- */

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // stored uppercase
  type: couponType("type").notNull(),
  // percent: whole percent (e.g. 15 = 15%); fixed: cents off
  value: integer("value").notNull(),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  maxRedemptions: integer("max_redemptions"), // null = unlimited
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Contact messages                                                           */
/* -------------------------------------------------------------------------- */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject"),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contact_messages_created_idx").on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, { relationName: "category_parent" }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  images: many(productImages),
  specs: many(productSpecs),
  inventory: one(inventory),
  fitment: many(productFitment),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productSpecsRelations = relations(productSpecs, ({ one }) => ({
  product: one(products, {
    fields: [productSpecs.productId],
    references: [products.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  fitment: many(productFitment),
}));

export const productFitmentRelations = relations(productFitment, ({ one }) => ({
  product: one(products, {
    fields: [productFitment.productId],
    references: [products.id],
  }),
  vehicle: one(vehicles, {
    fields: [productFitment.vehicleId],
    references: [vehicles.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  carts: many(carts),
  vendor: one(vendors, {
    fields: [users.id],
    references: [vendors.userId],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, {
    fields: [vendors.userId],
    references: [users.id],
  }),
  products: many(products),
  payouts: many(vendorPayouts),
}));

export const vendorPayoutsRelations = relations(vendorPayouts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorPayouts.vendorId],
    references: [vendors.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  returns: many(returns),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, {
    fields: [returns.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [returns.userId],
    references: [users.id],
  }),
}));
