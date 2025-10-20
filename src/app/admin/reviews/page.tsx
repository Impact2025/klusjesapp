'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, Gift } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import AdminLoading from '@/components/admin/AdminLoading';

export default function ReviewsManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<any>(null);
  const [unsubscribe, setUnsubscribe] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@klusjeskoning.nl') {
        setUser(user);
        // Load reviews from Firebase
        loadReviews();
      } else {
        router.push('/admin');
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router, unsubscribe]);

  const loadReviews = () => {
    const q = query(collection(db, 'reviews'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reviewsData: any[] = [];
      querySnapshot.forEach((doc) => {
        reviewsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        });
      });
      setReviews(reviewsData);
    });
    setUnsubscribe(() => unsubscribe);
  };

  const handleCreateReview = () => {
    setCurrentReview(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setRating(5);
    setAuthor('');
    setIsDialogOpen(true);
  };

  const handleEditReview = (review: any) => {
    setCurrentReview(review);
    setTitle(review.title || '');
    setSlug(review.slug || '');
    setExcerpt(review.excerpt || '');
    setContent(review.content || '');
    setRating(review.rating || 5);
    setAuthor(review.author || '');
    setIsDialogOpen(true);
  };

  const handleSaveReview = async () => {
    try {
      if (currentReview) {
        // Update existing review
        const reviewRef = doc(db, 'reviews', currentReview.id);
        await updateDoc(reviewRef, {
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
          excerpt,
          content,
          rating,
          author: author || 'Admin',
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new review
        await addDoc(collection(db, 'reviews'), {
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
          excerpt,
          content,
          rating,
          author: author || 'Admin',
          status: 'draft',
          createdAt: Timestamp.now(),
        });
      }
      // Reset form and close dialog
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent('');
      setRating(5);
      setAuthor('');
      setCurrentReview(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Er is een fout opgetreden bij het opslaan van de review.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm('Weet je zeker dat je deze review wilt verwijderen?')) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Er is een fout opgetreden bij het verwijderen van de review.');
      }
    }
  };

  // Reset form when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent('');
      setRating(5);
      setAuthor('');
      setCurrentReview(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <AdminLoading />;
  }

  if (!user) {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gift className="mr-2 h-6 w-6" />
            Reviews Beheer
          </h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reviews</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateReview}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {currentReview ? 'Bewerk Review' : 'Nieuwe Review'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Voer titel in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Auteur</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Voer auteur naam in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        id="rating"
                        min="1"
                        max="5"
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="ml-2 w-8 text-center">{rating}★</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="voer-slug-in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Samenvatting</Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Voer korte samenvatting in"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Inhoud</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Voer review inhoud in"
                      rows={10}
                    />
                  </div>
                </div>
                <CardFooter className="px-0 pb-0">
                  <Button onClick={handleSaveReview} className="w-full">
                    {currentReview ? 'Wijzigingen Opslaan' : 'Review Aanmaken'}
                  </Button>
                </CardFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-gray-200">
                <div className="bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3">Titel</div>
                    <div className="col-span-2">Auteur</div>
                    <div className="col-span-1">Rating</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Aangemaakt</div>
                    <div className="col-span-2 text-right">Acties</div>
                  </div>
                </div>
                <div className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <div key={review.id} className="grid grid-cols-12 gap-4 px-6 py-4">
                      <div className="col-span-3 font-medium text-gray-900">{review.title}</div>
                      <div className="col-span-2 text-gray-500">{review.author || 'Onbekend'}</div>
                      <div className="col-span-1">{renderRating(review.rating)}</div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          review.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {review.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-500">
                        {review.createdAt ? formatDate(review.createdAt) : 'Onbekend'}
                      </div>
                      <div className="col-span-2 flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="col-span-12 text-center py-8 text-gray-500">
                      Geen reviews gevonden. Maak je eerste review aan!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}