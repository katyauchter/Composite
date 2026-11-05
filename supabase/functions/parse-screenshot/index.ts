// Supabase Edge Function: read a nutrition screenshot with Claude and log it.
//
// The app uploads the image to the private "screenshots" bucket, inserts a row
// in public.screenshots, then calls this function with { screenshot_id }.
// The function runs as the signed-in user (their JWT), so row-level security
// still applies: a user can only parse their own screenshots.
//
// Secrets (set with `supabase secrets set ...`):
//   ANTHROPIC_API_KEY   required
//   ANTHROPIC_MODEL     optional, defaults to claude-sonnet-5-5

import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5';

const PROMPT = `This is a screenshot from a nutrition tracking app showing one day's intake.
Extract the day's totals. Reply with JSON only, no prose, in exactly this shape:
{"calories": number|null, "protein_g": number|null, "carbs_g": number|null, "fat_g": number|null,
 "fiber_g": number|null, "sugar_g": number|null, "sodium_mg": number|null,
 "date_shown": "YYYY-MM-DD"|null, "other_nutrients": {"name": number}, "confidence": "high"|"medium"|"low"}
Use the amounts actually eaten, not targets or remaining amounts. Labels may be in any language
(e.g. Spanish: Proteína, Carbohidratos, Grasas). Use null for anything not shown.`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  const { screenshot_id } = await req.json().catch(() => ({}));
  if (!screenshot_id) return json({ error: 'screenshot_id is required' }, 400);

  const { data: shot, error: shotErr } = await supabase
    .from('screenshots')
    .select('id, user_id, day, storage_path')
    .eq('id', screenshot_id)
    .single();
  if (shotErr || !shot) return json({ error: 'screenshot not found' }, 404);

  const fail = async (message: string) => {
    await supabase.from('screenshots').update({ status: 'failed', error: message }).eq('id', shot.id);
    return json({ error: message }, 502);
  };

  const { data: file, error: dlErr } = await supabase.storage.from('screenshots').download(shot.storage_path);
  if (dlErr || !file) return fail('could not download screenshot');

  const mediaType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const imageB64 = toBase64(new Uint8Array(await file.arrayBuffer()));

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageB64 } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) return fail(`Claude API error ${resp.status}: ${await resp.text()}`);

  const body = await resp.json();
  const text: string = body.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fail('no JSON in model reply');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return fail('could not parse model reply');
  }

  const num = (k: string) => (typeof parsed[k] === 'number' ? (parsed[k] as number) : null);

  // One "Daily total" entry per screenshot; re-parsing replaces it.
  const { error: insErr } = await supabase.from('nutrition_entries').upsert(
    {
      user_id: shot.user_id,
      day: shot.day,
      source: 'screenshot',
      label: 'Daily total',
      calories: num('calories'),
      protein_g: num('protein_g'),
      carbs_g: num('carbs_g'),
      fat_g: num('fat_g'),
      fiber_g: num('fiber_g'),
      sugar_g: num('sugar_g'),
      sodium_mg: num('sodium_mg'),
      extra: { other_nutrients: parsed.other_nutrients ?? {}, confidence: parsed.confidence ?? null },
      screenshot_id: shot.id,
      external_id: `screenshot:${shot.id}`,
    },
    { onConflict: 'user_id,source,external_id' },
  );
  if (insErr) return fail(`could not save entry: ${insErr.message}`);

  await supabase.from('screenshots').update({ status: 'parsed', parsed, error: null }).eq('id', shot.id);
  return json({ ok: true, parsed });
});
