const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function streamAITake(
  title: string,
  genres: string[],
  overview: string,
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      stream: true,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You are a witty film critic. Write 2-3 sentences on why someone would love this movie. Be enthusiastic and specific. No spoilers.',
        },
        {
          role: 'user',
          content: `Movie: ${title}\nGenres: ${genres.join(', ')}\nOverview: ${overview}`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {
        // skip malformed chunks
      }
    }
  }
}
