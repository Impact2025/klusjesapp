import { collection, getDocs, query, where, limit as limitQuery } from 'firebase/firestore';
import { db } from './firebase';
import type { BlogPost, Review } from './types';

const sortByPublishedDate = <T extends { publishedAt?: any; createdAt: any }>(items: T[]) =>
  [...items].sort((a, b) => {
    const aDate = a.publishedAt ?? a.createdAt;
    const bDate = b.publishedAt ?? b.createdAt;
    const aMillis = typeof aDate?.toMillis === 'function' ? aDate.toMillis() : 0;
    const bMillis = typeof bDate?.toMillis === 'function' ? bDate.toMillis() : 0;
    return bMillis - aMillis;
  });

export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'blogPosts'));
    const posts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as BlogPost));
    return sortByPublishedDate(posts.filter((post) => post.status === 'published'));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!db) return null;
  try {
    const postsQuery = query(collection(db, 'blogPosts'), where('slug', '==', slug), limitQuery(1));
    const snapshot = await getDocs(postsQuery);
    if (snapshot.empty) {
      return null;
    }
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as BlogPost;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return null;
  }
}

export async function fetchPublishedReviews(): Promise<Review[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'reviews'));
    const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Review));
    return sortByPublishedDate(items.filter((review) => review.status === 'published'));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function fetchReviewBySlug(slug: string): Promise<Review | null> {
  if (!db) return null;
  try {
    const reviewsQuery = query(collection(db, 'reviews'), where('slug', '==', slug), limitQuery(1));
    const snapshot = await getDocs(reviewsQuery);
    if (snapshot.empty) {
      return null;
    }
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Review;
  } catch (error) {
    console.error('Error fetching review by slug:', error);
    return null;
  }
}