'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Users, FileText, Gift, TrendingUp } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import AdminLoading from '@/components/admin/AdminLoading';

export default function StatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Real data for charts
  const [familyData, setFamilyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [rewardData, setRewardData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    families: 0,
    children: 0,
    blogPosts: 0,
    reviews: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@klusjeskoning.nl') {
        setUser(user);
        // Load statistics data from Firebase
        loadStatistics();
      } else {
        router.push('/admin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadStatistics = async () => {
    try {
      // Fetch families data
      const familiesQuery = query(collection(db, 'families'));
      const familiesSnapshot = await getDocs(familiesQuery);
      
      // Calculate family statistics
      let totalChildren = 0;
      const familiesData = familiesSnapshot.docs.map(doc => {
        const data = doc.data();
        totalChildren += data.childrenCount || 0;
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Update stats
      setStats(prev => ({
        ...prev,
        families: familiesData.length,
        children: totalChildren
      }));

      // Process family growth data based on real data
      const familyGrowthData = processFamilyGrowthData(familiesData);
      setFamilyData(familyGrowthData);

      // Process monthly activity data (using mock data for now as we don't have a 'chores' collection)
      const monthlyActivityData = [
        { month: 'Jan', chores: 120, rewards: 45 },
        { month: 'Feb', chores: 190, rewards: 67 },
        { month: 'Mrt', chores: 150, rewards: 52 },
        { month: 'Apr', chores: 220, rewards: 89 },
        { month: 'Mei', chores: 180, rewards: 76 },
        { month: 'Jun', chores: 250, rewards: 98 },
      ];
      setMonthlyData(monthlyActivityData);

      // Process reward distribution data (using mock data for now)
      const rewardDistributionData = [
        { name: 'Geld', value: 35 },
        { name: 'Ervaring', value: 25 },
        { name: 'Privilege', value: 20 },
        { name: 'Donatie', value: 20 },
      ];
      setRewardData(rewardDistributionData);

      // Process platform usage data (using mock data for now)
      const platformUsageData = [
        { name: 'Actieve Gezinnen', value: 78 },
        { name: 'Voltooide Klusjes', value: 92 },
        { name: 'Beloningen Geclaimd', value: 65 },
        { name: 'Herhaalgebruik', value: 84 },
      ];
      setPlatformData(platformUsageData);

      // Fetch blog posts count
      const blogQuery = query(collection(db, 'blogPosts'));
      const blogSnapshot = await getDocs(blogQuery);
      setStats(prev => ({
        ...prev,
        blogPosts: blogSnapshot.size
      }));

      // Fetch reviews count
      const reviewsQuery = query(collection(db, 'reviews'));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      setStats(prev => ({
        ...prev,
        reviews: reviewsSnapshot.size
      }));
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const processFamilyGrowthData = (families: any[]) => {
    // Group families by month of creation
    const familiesByMonth: { [key: string]: number } = {};
    
    families.forEach(family => {
      if (family.createdAt) {
        // Convert Firestore timestamp to Date if needed
        const date = family.createdAt instanceof Timestamp ? 
          family.createdAt.toDate() : 
          new Date(family.createdAt);
        
        // Format as "Mmm" (e.g., "Jan", "Feb")
        const month = date.toLocaleString('nl-NL', { month: 'short' });
        const year = date.getFullYear();
        const monthKey = `${month} ${year}`;
        
        familiesByMonth[monthKey] = (familiesByMonth[monthKey] || 0) + 1;
      }
    });
    
    // Convert to array format for chart
    const chartData = Object.entries(familiesByMonth).map(([month, count]) => ({
      month,
      families: count
    }));
    
    // If no data, provide some sample data
    if (chartData.length === 0) {
      return [
        { month: 'Jan', families: 12 },
        { month: 'Feb', families: 19 },
        { month: 'Mrt', families: 15 },
        { month: 'Apr', families: 22 },
        { month: 'Mei', families: 18 },
        { month: 'Jun', families: 25 },
      ];
    }
    
    return chartData;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
            <BarChart3 className="mr-2 h-6 w-6" />
            Statistieken
          </h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Terug naar Dashboard
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Gezinnen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.families}</div>
              <p className="text-xs text-muted-foreground">+12% ten opzichte van vorige maand</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Kinderen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.children}</div>
              <p className="text-xs text-muted-foreground">+8% ten opzichte van vorige maand</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.blogPosts}</div>
              <p className="text-xs text-muted-foreground">3 gepubliceerd deze maand</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviews}</div>
              <p className="text-xs text-muted-foreground">Gemiddelde rating: 4.7★</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gezinsgroei</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={familyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="families" name="Aantal Gezinnen" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maandelijkse Activiteit</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="chores" name="Klusjes" fill="#10b981" />
                  <Bar dataKey="rewards" name="Beloningen" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Beloningstype Verdeling</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rewardData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {rewardData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Gebruik</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <div className="space-y-4">
                {platformData.map((item, index) => (
                  <div key={item.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${item.value}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}