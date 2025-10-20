'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, FileText, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import AdminLoading from '@/components/admin/AdminLoading';
import { BLOG_CATEGORIES, AUDIENCE_SEGMENTS } from '@/lib/blog/constants';

export default function BlogManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<any>(null);
  const [unsubscribe, setUnsubscribe] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state for manual blog
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');

  // Form state for AI blog
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [extraKeywords, setExtraKeywords] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState('warm, praktisch, educatief, speels, betrouwbaar');
  const [targetAudience, setTargetAudience] = useState('ouders 6–13 jaar');
  const [writingStyle, setWritingStyle] = useState('blogartikel');
  const [category, setCategory] = useState<string>(BLOG_CATEGORIES[0]);
  const [audienceSegment, setAudienceSegment] = useState<string>(AUDIENCE_SEGMENTS[0]);
  const [customFocus, setCustomFocus] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@klusjeskoning.nl') {
        setUser(user);
        // Load blog posts from Firebase
        loadBlogPosts();
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

  const loadBlogPosts = () => {
    const q = query(collection(db, 'blogPosts'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const blogsData: any[] = [];
      querySnapshot.forEach((doc) => {
        blogsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        });
      });
      setBlogs(blogsData);
    });
    setUnsubscribe(() => unsubscribe);
  };

  const handleCreateBlog = () => {
    setCurrentBlog(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setIsDialogOpen(true);
  };

  const handleCreateAIBlog = () => {
    // Reset AI form
    setPrimaryKeyword('');
    setExtraKeywords('');
    setToneOfVoice('warm, praktisch, educatief, speels, betrouwbaar');
    setTargetAudience('ouders 6–13 jaar');
    setWritingStyle('blogartikel');
    setCategory(BLOG_CATEGORIES[0]);
    setAudienceSegment(AUDIENCE_SEGMENTS[0]);
    setCustomFocus('');
    setIsAIDialogOpen(true);
  };

  const handleEditBlog = (blog: any) => {
    setCurrentBlog(blog);
    setTitle(blog.title || '');
    setSlug(blog.slug || '');
    setExcerpt(blog.excerpt || '');
    setContent(blog.content || '');
    setIsDialogOpen(true);
  };

  const handleSaveBlog = async () => {
    try {
      if (currentBlog) {
        // Update existing blog
        const blogRef = doc(db, 'blogPosts', currentBlog.id);
        await updateDoc(blogRef, {
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
          excerpt,
          content,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new blog
        await addDoc(collection(db, 'blogPosts'), {
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
          excerpt,
          content,
          status: 'draft',
          createdAt: Timestamp.now(),
        });
      }
      // Reset form and close dialog
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent('');
      setCurrentBlog(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert('Er is een fout opgetreden bij het opslaan van de blog post.');
    }
  };

  const handleGenerateAIBlog = async () => {
    if (!primaryKeyword) {
      alert('Primair keyword is verplicht.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryKeyword,
          extraKeywords,
          toneOfVoice,
          targetAudience,
          writingStyle,
          category,
          audienceSegment,
          customFocus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Er is een fout opgetreden bij het genereren van het blog artikel.');
      }

      const result = await response.json();
      
      // Create a new blog post with the generated content
      await addDoc(collection(db, 'blogPosts'), {
        title: result.seo_json.meta_title,
        slug: result.seo_json.slug,
        excerpt: result.seo_json.meta_description,
        content: result.article_html,
        status: 'draft',
        createdAt: Timestamp.now(),
        seo: result.seo_json,
      });

      // Close the AI dialog
      setIsAIDialogOpen(false);
      alert('AI-blog succesvol gegenereerd en opgeslagen als concept!');
    } catch (error) {
      console.error('Error generating AI blog:', error);
      alert('Er is een fout opgetreden bij het genereren van het blog artikel: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (confirm('Weet je zeker dat je deze blog post wilt verwijderen?')) {
      try {
        await deleteDoc(doc(db, 'blogPosts', id));
      } catch (error) {
        console.error('Error deleting blog post:', error);
        alert('Er is een fout opgetreden bij het verwijderen van de blog post.');
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
      setCurrentBlog(null);
    }
  };

  const handleAIDialogChange = (open: boolean) => {
    setIsAIDialogOpen(open);
    if (!open) {
      // Reset AI form when dialog closes
      setPrimaryKeyword('');
      setExtraKeywords('');
      setToneOfVoice('warm, praktisch, educatief, speels, betrouwbaar');
      setTargetAudience('ouders 6–13 jaar');
      setWritingStyle('blogartikel');
      setCategory(BLOG_CATEGORIES[0]);
      setAudienceSegment(AUDIENCE_SEGMENTS[0]);
      setCustomFocus('');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
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
            <FileText className="mr-2 h-6 w-6" />
            Blog Beheer
          </h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Blog Posts</CardTitle>
            <div className="flex space-x-2">
              <Dialog open={isAIDialogOpen} onOpenChange={handleAIDialogChange}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreateAIBlog}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Blog Genereren
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Genereer AI Blog</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryKeyword">Primair Keyword *</Label>
                      <Input
                        id="primaryKeyword"
                        value={primaryKeyword}
                        onChange={(e) => setPrimaryKeyword(e.target.value)}
                        placeholder="Voer primair keyword in"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="extraKeywords">Extra Keywords</Label>
                      <Input
                        id="extraKeywords"
                        value={extraKeywords}
                        onChange={(e) => setExtraKeywords(e.target.value)}
                        placeholder="Comma-separated keywords"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="toneOfVoice">Toon</Label>
                      <Input
                        id="toneOfVoice"
                        value={toneOfVoice}
                        onChange={(e) => setToneOfVoice(e.target.value)}
                        placeholder="warm, praktisch, educatief, speels, betrouwbaar"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Doelgroep</Label>
                      <Input
                        id="targetAudience"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="ouders 6–13 jaar"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="writingStyle">Stijl</Label>
                      <Select value={writingStyle} onValueChange={setWritingStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer stijl" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blogartikel">Blogartikel</SelectItem>
                          <SelectItem value="gids">Gids</SelectItem>
                          <SelectItem value="nieuwsbericht">Nieuwsbericht</SelectItem>
                          <SelectItem value="tips">Tips</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Categorie</Label>
                      <Select value={category} onValueChange={(value) => setCategory(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOG_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="audienceSegment">Doelgroep Segment</Label>
                      <Select value={audienceSegment} onValueChange={(value) => setAudienceSegment(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer doelgroep segment" />
                        </SelectTrigger>
                        <SelectContent>
                          {AUDIENCE_SEGMENTS.map((segment) => (
                            <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customFocus">Extra Focus (optioneel)</Label>
                      <Textarea
                        id="customFocus"
                        value={customFocus}
                        onChange={(e) => setCustomFocus(e.target.value)}
                        placeholder="Optionele notities over specifieke hoek, productfunctie of doel"
                        rows={3}
                      />
                    </div>
                  </div>
                  <CardFooter className="px-0 pb-0">
                    <Button onClick={handleGenerateAIBlog} disabled={isGenerating} className="w-full">
                      {isGenerating ? 'Genereren...' : 'Genereer Blog'}
                    </Button>
                  </CardFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreateBlog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuwe Blog Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {currentBlog ? 'Bewerk Blog Post' : 'Nieuwe Blog Post'}
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
                        placeholder="Voer blog inhoud in"
                        rows={10}
                      />
                    </div>
                  </div>
                  <CardFooter className="px-0 pb-0">
                    <Button onClick={handleSaveBlog} className="w-full">
                      {currentBlog ? 'Wijzigingen Opslaan' : 'Blog Post Aanmaken'}
                    </Button>
                  </CardFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-gray-200">
                <div className="bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3">Titel</div>
                    <div className="col-span-2">Slug</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Aangemaakt</div>
                    <div className="col-span-2 text-right">Acties</div>
                  </div>
                </div>
                <div className="bg-white divide-y divide-gray-200">
                  {blogs.map((blog) => (
                    <div key={blog.id} className="grid grid-cols-12 gap-4 px-6 py-4">
                      <div className="col-span-3 font-medium text-gray-900">{blog.title}</div>
                      <div className="col-span-2 text-gray-500">{blog.slug}</div>
                      <div className="col-span-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          blog.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {blog.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                        </span>
                      </div>
                      <div className="col-span-3 text-gray-500">
                        {blog.createdAt ? formatDate(blog.createdAt) : 'Onbekend'}
                      </div>
                      <div className="col-span-2 flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditBlog(blog)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteBlog(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {blogs.length === 0 && (
                    <div className="col-span-12 text-center py-8 text-gray-500">
                      Geen blog posts gevonden. Maak je eerste blog post aan!
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