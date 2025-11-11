import 'server-only';

import { listBlogPosts, listReviews } from '@/server/services/family-service';
import { mapBlogPost, mapReview } from '@/lib/api/app-client';
import type { BlogPost, Review } from './types';

const sortByPublishedDate = <T extends { publishedAt?: string | null; createdAt: string | null }>(items: T[]) =>
  [...items].sort((a, b) => {
    const aDate = a.publishedAt ?? a.createdAt ?? null;
    const bDate = b.publishedAt ?? b.createdAt ?? null;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return bTime - aTime;
  });

export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping blog posts');
      return [];
    }
    const posts = await listBlogPosts();
    const serializable = sortByPublishedDate(posts.filter((post) => post.status === 'published'));
    return serializable.map(mapBlogPost);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping blog post');
      return null;
    }
    const posts = await listBlogPosts();
    const match = posts.find((post) => post.slug === slug);
    return match ? mapBlogPost(match) : null;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

export async function fetchPublishedReviews(): Promise<Review[]> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping reviews');
      return [];
    }
    const reviews = await listReviews();
    const serializable = sortByPublishedDate(reviews.filter((review) => review.status === 'published'));
    return serializable.map(mapReview);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function fetchReviewBySlug(slug: string): Promise<Review | null> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping review');
      return null;
    }
    const reviews = await listReviews();
    const match = reviews.find((review) => review.slug === slug);
    return match ? mapReview(match) : null;
  } catch (error) {
    console.error('Error fetching review by slug:', error);
    return null;
  }
}