import { NextRequest, NextResponse } from 'next/server';
import { ProviderId } from '@/lib/llm/providers/types';
import { getProvider, getDefaultModel } from '@/lib/llm/providers/registry';
import { logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider } = await request.json();
    
    if (!apiKey || !provider) {
      return NextResponse.json(
        { error: 'API key and provider are required' },
        { status: 400 }
      );
    }

    const providerConfig = getProvider(provider as ProviderId);
    let isValid = false;

    switch (provider) {
      case 'hanzo': {
        // The gateway's GET /models is public — it answers 200 for any string,
        // so the generic `default` branch below rubber-stamped every Hanzo key
        // and the paste of a typo'd one only failed later, at generation.
        // /chat/completions is the endpoint that actually authenticates.
        const hanzoResp = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: getDefaultModel('hanzo'),
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1
          })
        });
        // Only the credential verdicts mean "bad key". A 402 (out of credit) or
        // a 5xx is a real key meeting a different problem.
        isValid = hanzoResp.status !== 401 && hanzoResp.status !== 403;
        break;
      }

      case 'openrouter':
        const openrouterResp = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = openrouterResp.ok;
        break;

      case 'openai':
      case 'openai-codex':
        const openaiResp = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = openaiResp.ok;
        break;

      case 'anthropic':
        const anthropicResp = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        });
        isValid = anthropicResp.ok;
        break;

      case 'groq':
        const groqResp = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = groqResp.ok;
        break;

      case 'ollama':
      case 'lmstudio':
      case 'llamacpp':
        const localResp = await fetch(`${providerConfig.baseUrl}/models`);
        isValid = localResp.ok;
        break;

      case 'gemini':
        isValid = !!apiKey && apiKey.length > 10;
        break;

      case 'zhipu':
      case 'minimax':
        isValid = !!apiKey && apiKey.length > 10;
        break;

      case 'huggingface':
        const hfResp = await fetch('https://huggingface.co/api/whoami-v2', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = hfResp.ok;
        break;

      default:
        // For other OpenAI-compatible providers
        if (providerConfig.baseUrl) {
          const defaultResp = await fetch(`${providerConfig.baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          isValid = defaultResp.ok;
        } else {
          isValid = false;
        }
        break;
    }

    return NextResponse.json({ valid: isValid });

  } catch (error) {
    logger.error('Validation error:', error);
    return NextResponse.json({ valid: false });
  }
}
