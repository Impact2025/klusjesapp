'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import AdminLoading from '@/components/admin/AdminLoading';

export default function FamiliesManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentFamily, setCurrentFamily] = useState<any>(null);

  // Form state
  const [familyName, setFamilyName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [familyCode, setFamilyCode] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@klusjeskoning.nl') {
        setUser(user);
        // Load families from Firebase
        loadFamilies();
      } else {
        router.push('/admin');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  const loadFamilies = () => {
    const q = query(collection(db, 'families'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const familiesData: any[] = [];
      querySnapshot.forEach((doc) => {
        familiesData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        });
      });
      setFamilies(familiesData);
    });
    return unsubscribe;
  };

  const handleCreateFamily = () => {
    setCurrentFamily(null);
    setFamilyName('');
    setCity('');
    setEmail('');
    setFamilyCode('');
    setIsDialogOpen(true);
  };

  const handleEditFamily = (family: any) => {
    console.log('Edit button clicked for family:', family);
    setCurrentFamily(family);
    setFamilyName(family.familyName || '');
    setCity(family.city || '');
    setEmail(family.email || '');
    setFamilyCode(family.familyCode || '');
    setIsDialogOpen(true);
    console.log('Dialog should be open now with family data');
  };

  const handleSaveFamily = async () => {
    try {
      if (currentFamily) {
        // Update existing family
        const familyRef = doc(db, 'families', currentFamily.id);
        await updateDoc(familyRef, {
          familyName,
          city,
          email,
          familyCode,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new family
        await addDoc(collection(db, 'families'), {
          familyName,
          city,
          email,
          familyCode: familyCode || generateFamilyCode(),
          childrenCount: 0,
          createdAt: Timestamp.now(),
        });
      }
      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving family:', error);
      alert('Er is een fout opgetreden bij het opslaan van het gezin.');
    }
  };

  const handleDeleteFamily = async (id: string) => {
    if (confirm('Weet je zeker dat je dit gezin wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      try {
        await deleteDoc(doc(db, 'families', id));
      } catch (error) {
        console.error('Error deleting family:', error);
        alert('Er is een fout opgetreden bij het verwijderen van het gezin.');
      }
    }
  };

  const generateFamilyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
            <Users className="mr-2 h-6 w-6" />
            Beheer Gezinnen
          </h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gezinnen</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateFamily}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuw Gezin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {currentFamily ? 'Bewerk Gezin' : 'Nieuw Gezin'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Gezinsnaam</Label>
                    <Input
                      id="familyName"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="Voer gezinsnaam in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Stad</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Voer stad in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Voer e-mailadres in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="familyCode">Gezinscode</Label>
                    <Input
                      id="familyCode"
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value)}
                      placeholder="Voer gezinscode in"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveFamily}>
                    {currentFamily ? 'Wijzigingen Opslaan' : 'Gezin Aanmaken'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-gray-200">
                <div className="bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3">Gezinsnaam</div>
                    <div className="col-span-2">Stad</div>
                    <div className="col-span-3">E-mail</div>
                    <div className="col-span-1">Kinderen</div>
                    <div className="col-span-2">Aangemaakt</div>
                    <div className="col-span-1 text-right">Acties</div>
                  </div>
                </div>
                <div className="bg-white divide-y divide-gray-200">
                  {families.map((family) => (
                    <div key={family.id} className="grid grid-cols-12 gap-4 px-6 py-4">
                      <div className="col-span-3 font-medium text-gray-900">
                        {family.familyName}
                        <div className="text-xs text-gray-500">Code: {family.familyCode}</div>
                      </div>
                      <div className="col-span-2 text-gray-500">{family.city}</div>
                      <div className="col-span-3 text-gray-500">{family.email}</div>
                      <div className="col-span-1 text-gray-500">{family.childrenCount || 0}</div>
                      <div className="col-span-2 text-gray-500">
                        {family.createdAt ? formatDate(family.createdAt) : 'Onbekend'}
                      </div>
                      <div className="col-span-1 flex justify-end space-x-1">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditFamily(family)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteFamily(family.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {families.length === 0 && (
                    <div className="col-span-12 text-center py-8 text-gray-500">
                      Geen gezinnen gevonden. Maak je eerste gezin aan!
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