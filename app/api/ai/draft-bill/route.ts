import { NextResponse } from 'next/server';
import { draftBillFromPrompt } from '@/lib/aiExplainer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, vehicleModel, serviceType } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Please provide a repair prompt or service notes' }, { status: 400 });
    }

    const result = await draftBillFromPrompt(prompt, { vehicleModel, serviceType });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/ai/draft-bill:', error);
    return NextResponse.json({ error: 'Failed to auto-draft bill' }, { status: 500 });
  }
}
