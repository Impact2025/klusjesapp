import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const planTierEnum = pgEnum('plan_tier', ['starter', 'premium']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['inactive', 'active', 'past_due', 'canceled']);
export const billingIntervalEnum = pgEnum('billing_interval', ['monthly', 'yearly']);
export const choreStatusEnum = pgEnum('chore_status', ['available', 'submitted', 'approved']);
export const rewardTypeEnum = pgEnum('reward_type', ['privilege', 'experience', 'donation', 'money']);
export const publishStatusEnum = pgEnum('publish_status', ['draft', 'published']);

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyCode: varchar('family_code', { length: 16 }).notNull().unique(),
  familyName: varchar('family_name', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  recoveryEmail: varchar('recovery_email', { length: 255 }),
  subscriptionPlan: planTierEnum('subscription_plan'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('inactive'),
  subscriptionInterval: billingIntervalEnum('subscription_interval'),
  subscriptionRenewalDate: timestamp('subscription_renewal_date', { withTimezone: true }),
  subscriptionLastPaymentAt: timestamp('subscription_last_payment_at', { withTimezone: true }),
  subscriptionOrderId: varchar('subscription_order_id', { length: 255 }),
});

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  pin: varchar('pin', { length: 32 }).notNull(),
  points: integer('points').notNull().default(0),
  totalPointsEver: integer('total_points_ever').notNull().default(0),
  avatar: varchar('avatar', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chores = pgTable('chores', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  points: integer('points').notNull().default(0),
  status: choreStatusEnum('status').notNull().default('available'),
  submittedByChildId: uuid('submitted_by_child_id').references(() => children.id, {
    onDelete: 'set null',
  }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  emotion: varchar('emotion', { length: 255 }),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const choreAssignments = pgTable(
  'chore_assignments',
  {
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.choreId, table.childId] }),
  })
);

export const choreAssignmentsRelations = relations(choreAssignments, ({ one }) => ({
  chore: one(chores, {
    fields: [choreAssignments.choreId],
    references: [chores.id],
  }),
  child: one(children, {
    fields: [choreAssignments.childId],
    references: [children.id],
  }),
}));

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  points: integer('points').notNull().default(0),
  type: rewardTypeEnum('type').notNull().default('privilege'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rewardAssignments = pgTable(
  'reward_assignments',
  {
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rewardId, table.childId] }),
  })
);

export const rewardAssignmentsRelations = relations(rewardAssignments, ({ one }) => ({
  reward: one(rewards, {
    fields: [rewardAssignments.rewardId],
    references: [rewards.id],
  }),
  child: one(children, {
    fields: [rewardAssignments.childId],
    references: [children.id],
  }),
}));

export const pendingRewards = pgTable('pending_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id')
    .notNull()
    .references(() => rewards.id, { onDelete: 'cascade' }),
  points: integer('points').notNull().default(0),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const goodCauses = pgTable('good_causes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  coverImageUrl: text('cover_image_url'),
  tags: text('tags').array(),
  status: publishStatusEnum('status').notNull().default('draft'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  rating: integer('rating').notNull().default(0),
  author: varchar('author', { length: 255 }).notNull(),
  status: publishStatusEnum('status').notNull().default('draft'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
export type Chore = typeof chores.$inferSelect;
export type NewChore = typeof chores.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type PendingReward = typeof pendingRewards.$inferSelect;
export type NewPendingReward = typeof pendingRewards.$inferInsert;
export type GoodCause = typeof goodCauses.$inferSelect;
export type NewGoodCause = typeof goodCauses.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export const familiesRelations = relations(families, ({ many }) => ({
  children: many(children),
  chores: many(chores),
  rewards: many(rewards),
  pendingRewards: many(pendingRewards),
  sessions: many(sessions),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  family: one(families, {
    fields: [children.familyId],
    references: [families.id],
  }),
  choreAssignments: many(choreAssignments),
  rewardAssignments: many(rewardAssignments),
  pendingRewards: many(pendingRewards),
  submittedChores: many(chores, {
    relationName: 'submittedChores',
  }),
}));

export const choresRelations = relations(chores, ({ one, many }) => ({
  family: one(families, {
    fields: [chores.familyId],
    references: [families.id],
  }),
  assignments: many(choreAssignments),
  pendingRewards: many(pendingRewards),
  submittedByChild: one(children, {
    fields: [chores.submittedByChildId],
    references: [children.id],
    relationName: 'submittedChores',
  }),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  family: one(families, {
    fields: [rewards.familyId],
    references: [families.id],
  }),
  assignments: many(rewardAssignments),
  pendingRewards: many(pendingRewards),
}));

export const pendingRewardsRelations = relations(pendingRewards, ({ one }) => ({
  family: one(families, {
    fields: [pendingRewards.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [pendingRewards.childId],
    references: [children.id],
  }),
  reward: one(rewards, {
    fields: [pendingRewards.rewardId],
    references: [rewards.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  family: one(families, {
    fields: [sessions.familyId],
    references: [families.id],
  }),
}));
