import { NextResponse } from 'next/server';
import { generateBlogArticle } from '@/ai/flows/generate-blog-article-flow';
import { z } from 'zod';

const GenerateBlogRequestSchema = z.object({
  primaryKeyword: z.string().min(1, 'Primair keyword is verplicht.'),
  extraKeywords: z.string().optional().default(''),
  toneOfVoice: z.string().min(1, 'Toon is verplicht.'),
  targetAudience: z.string().min(1, 'Doelgroep is verplicht.'),
  writingStyle: z.string().min(1, 'Stijl is verplicht.'),
  category: z.string().min(1, 'Categorie is verplicht.'),
  audienceSegment: z.string().min(1, 'Doelgroepsegment is verplicht.'),
  customFocus: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = GenerateBlogRequestSchema.parse(body);
    
    // Generate the blog article using AI
    const result = await generateBlogArticle({
      primaryKeyword: validatedData.primaryKeyword,
      extraKeywords: validatedData.extraKeywords,
      toneOfVoice: validatedData.toneOfVoice,
      targetAudience: validatedData.targetAudience,
      writingStyle: validatedData.writingStyle,
      category: validatedData.category as any,
      audienceSegment: validatedData.audienceSegment as any,
      customFocus: validatedData.customFocus,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating blog article:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ongeldige invoer', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van het blog artikel.' },
      { status: 500 }
      );
  }
}

export const runtime = 'nodejs';