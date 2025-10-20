'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BLOG_CATEGORIES, AUDIENCE_SEGMENTS } from '@/lib/blog/constants';

export default function TestAIBlogGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [primaryKeyword, setPrimaryKeyword] = useState('kinderen motiveren');
  const [extraKeywords, setExtraKeywords] = useState('opvoeding, samenwerking, sparen, gezin, verantwoordelijkheid');
  const [toneOfVoice, setToneOfVoice] = useState('warm, praktisch, educatief, speels, betrouwbaar');
  const [targetAudience, setTargetAudience] = useState('ouders 6–13 jaar');
  const [writingStyle, setWritingStyle] = useState('blogartikel');
  const [category, setCategory] = useState<string>(BLOG_CATEGORIES[0]);
  const [audienceSegment, setAudienceSegment] = useState<string>(AUDIENCE_SEGMENTS[0]);
  const [customFocus, setCustomFocus] = useState('');

  const handleGenerate = async () => {
    if (!primaryKeyword) {
      setError('Primair keyword is verplicht.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

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

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error generating blog:', err);
      setError('Er is een fout opgetreden: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test AI Blog Generator</CardTitle>
        </CardHeader>
        <CardContent>
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
            
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Genereren...' : 'Genereer Blog'}
            </Button>
            
            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded">
                <strong>Fout:</strong> {error}
              </div>
            )}
            
            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-green-100 text-green-800 rounded">
                  <strong>Succes!</strong> Blog gegenereerd.
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">SEO JSON</h3>
                  <pre className="p-4 bg-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(result.seo_json, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Artikel HTML</h3>
                  <div 
                    className="p-4 bg-white border rounded"
                    dangerouslySetInnerHTML={{ __html: result.article_html }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}