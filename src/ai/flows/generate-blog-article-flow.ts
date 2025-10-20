'use server';

import { z } from 'genkit';
import {
  AUDIENCE_SEGMENT_DETAILS,
  AUDIENCE_SEGMENTS,
  BLOG_CATEGORIES,
  BLOG_CATEGORY_DETAILS,
  type AudienceSegment,
  type BlogCategory,
} from '@/lib/blog/constants';

const GenerateBlogArticleInputSchema = z.object({
  category: z.enum(BLOG_CATEGORIES).describe('The primary content pillar to write about.'),
  audienceSegment: z.enum(AUDIENCE_SEGMENTS).describe('The audience segment to tailor the article to.'),
  primaryKeyword: z.string().min(1, 'Primair keyword is verplicht.'),
  extraKeywords: z.string().optional().default(''),
  toneOfVoice: z.string().min(1, 'Toon is verplicht.'),
  targetAudience: z.string().min(1, 'Doelgroep is verplicht.'),
  writingStyle: z.string().min(1, 'Stijl is verplicht.'),
  customFocus: z
    .string()
    .optional()
    .describe('Optional notes about a specific angle, product feature or goal to highlight.'),
});
export type GenerateBlogArticleInput = z.infer<typeof GenerateBlogArticleInputSchema>;

const SEOJsonSchema = z.object({
  focus_keyphrase: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  slug: z.string(),
  tags: z.string(),
  social_blurb: z.string(),
  social_hashtags: z.string(),
  midjourney_prompt: z.string(),
});

const GenerateBlogArticleOutputSchema = z.object({
  article_html: z.string(),
  seo_json: SEOJsonSchema,
  midjourney_prompt: z.string(),
});
export type GenerateBlogArticleOutput = z.infer<typeof GenerateBlogArticleOutputSchema>;

const PromptInputSchema = GenerateBlogArticleInputSchema.extend({
  categoryBrief: z.string(),
  audienceProfile: z.string(),
  audienceNeeds: z.string(),
  audienceMotivation: z.string(),
  audienceChannels: z.string(),
  audienceMessage: z.string(),
});

// Function to generate blog article using OpenRouter API directly
async function callOpenRouterAPI(prompt: string): Promise<GenerateBlogArticleOutput> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'KlusjesKoning Blog Generator',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent hoofdredacteur van KlusjesKoning.nl — een vrolijk, educatief platform voor gezinnen (kinderen 6–13). Geef je antwoord in het Nederlands en volg de instructies strikt.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content returned from OpenRouter API');
  }

  try {
    // Parse the JSON response
    const parsedContent = JSON.parse(content);
    return parsedContent;
  } catch (error) {
    console.error('Error parsing OpenRouter response:', content);
    throw new Error('Failed to parse response from OpenRouter API');
  }
}

function createPrompt(input: any): string {
  const prompt = `Gebruik onderstaande input en schrijf een volledige blogpost.

Belangrijke productcontext:
- KlusjesKoning laat gezinnen verantwoordelijkheid, sparen en doneren spelenderwijs ervaren.
- Kinderen verdienen punten door klusjes te doen en kunnen die besteden aan beloningen of goede doelen.
- Ouders zoeken warmte, structuur en praktische tips.

Invoer:
PrimairKeyword: ${input.primaryKeyword}
ExtraKeywords: ${input.extraKeywords}
ToneOfVoice: ${input.toneOfVoice}
Doelgroep: ${input.targetAudience}
Lengte: 700–900 woorden
Stijl: ${input.writingStyle}

Contentcontext ter inspiratie:
- Contentpijler: ${input.category}
- Context: ${input.categoryBrief}
- Doelgroepprofiel: ${input.audienceProfile}
- Behoeften: ${input.audienceNeeds}
- Motivatie: ${input.audienceMotivation}
- Communicatiekanalen: ${input.audienceChannels}
- Merkboodschap: ${input.audienceMessage}
${input.customFocus ? `- Extra focus: ${input.customFocus}` : ''}

Schrijfregels (strikt naleven):
- Taal: Nederlands.
- Zinnen: maximaal 20 woorden per zin.
- Lengte: 700–900 woorden.
- Toon: warm, praktisch, positief, betrouwbaar.
- Geen emoji's, geen verwijzing naar AI.
- Geen inline CSS of styles in de HTML.
- Gebruik het PrimairKeyword in titel, eerste alinea en minstens één H2.
- Verwerk ExtraKeywords natuurlijk en beperkt.
- Structuur exact volgens het artikel-format.
- Optimaliseer voor SEO met duidelijke koppen en scanbare alinea's.

Artikelstructuur (exact aanhouden, zonder extra koppen):

H1: Pakkende titel met PrimairKeyword

Intro: 2–3 zinnen – waarom dit onderwerp relevant is voor de doelgroep

H2: Wat is er aan de hand?
Uitleg van context/aanleiding (onderzoek, trend, praktijk) in eenvoudige taal

H2: Wat betekent dit voor gezinnen?
3–5 korte, praktische tips in bullets

H2: Onze visie (KlusjesKoning)
Koppel aan verantwoordelijkheid, samenwerking, geldwaarde of maatschappelijke betrokkenheid

H2: Wat kun jij vandaag doen?
Concreet stappenlijstje of voorbeeldklusjes

Slot
Positieve afsluiting met uitnodiging om KlusjesKoning te proberen of meer tips te lezen

Bron
Onder het artikel: Bron: [{{Link}}] (laat {{Link}} als placeholder staan)

Outputvereisten:
- Retourneer een JSON-object met velden: article_html (string), seo_json (object), midjourney_prompt (string).
- article_html bevat het volledige artikel in HTML conform structuur.
- Gebruik <p> tags voor alinea's met voldoende witruimte ertussen.
- Gebruik <h1> voor de hoofdtitel, <h2> voor subkoppen.
- Gebruik <ul> en <li> voor bullet lists.
- Elke sectie moet gescheiden zijn met witruimte voor leesbaarheid.
- seo_json bevat de meta-informatie:
  {
    "focus_keyphrase": "${input.primaryKeyword}",
    "meta_title": "Titel ≤ 60 tekens met keyword",
    "meta_description": "Samenvatting ≤ 155 tekens met keyword",
    "slug": "korte-slug-met-koppelteken",
    "tags": "${input.extraKeywords}",
    "social_blurb": "1–2 zinnen warme praktische toon",
    "social_hashtags": "klusjeskoning,opvoeding,gezinnen,leren,motivatie",
    "midjourney_prompt": "realistische 1:1 foto van een gezin dat samen een eenvoudige huishoudklus doet in natuurlijk licht, warme huiselijke sfeer, geen merken of logo's, scherpe focus"
  }
- midjourney_prompt: "realistische 1:1 foto van een ouder en kind die samen de woonkamer opruimen in warm natuurlijk licht, ontspannen en vrolijke sfeer, geen merken of logo's, scherpe focus"

Focus op praktische toepasbaarheid voor ouders met kinderen 6–13. Gebruik herkenbare voorbeelden en stimuleer samenwerking, sparen of doneren.

Geef je antwoord als een JSON-object met de volgende structuur:
{
  "article_html": "HTML content van het artikel",
  "seo_json": {
    "focus_keyphrase": "primair keyword",
    "meta_title": "Titel van het artikel",
    "meta_description": "Beschrijving van het artikel",
    "slug": "slug-voor-de-url",
    "tags": "extra,keywords,gescheiden,door,komma",
    "social_blurb": "Korte tekst voor sociale media",
    "social_hashtags": "klusjeskoning,opvoeding,gezinnen",
    "midjourney_prompt": "Prompt voor MidJourney"
  },
  "midjourney_prompt": "Prompt voor MidJourney"
}`;

  return prompt;
}

export async function generateBlogArticle(
  input: GenerateBlogArticleInput
): Promise<GenerateBlogArticleOutput> {
  const audience = AUDIENCE_SEGMENT_DETAILS[input.audienceSegment as AudienceSegment];
  const promptInput = {
    ...input,
    categoryBrief: BLOG_CATEGORY_DETAILS[input.category as BlogCategory],
    audienceProfile: audience.profile,
    audienceNeeds: audience.needs,
    audienceMotivation: audience.motivation,
    audienceChannels: audience.channels,
    audienceMessage: audience.message,
  };

  const prompt = createPrompt(promptInput);
  return callOpenRouterAPI(prompt);
}