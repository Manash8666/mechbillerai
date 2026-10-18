import { NextResponse } from 'next/server';
import { generateAiExplanations, getAutomotiveTechnicalExplanation } from '@/lib/aiExplainer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, item, vehicleModel, serviceCategory } = body;

    // Single item quick lookup
    if (item && typeof item === 'string') {
      const explanation = getAutomotiveTechnicalExplanation(item, { vehicleModel, serviceCategory });
      return NextResponse.json({ item, explanation });
    }

    // Batch items lookup
    const itemList = Array.isArray(items) ? items.filter(Boolean) : [];
    if (itemList.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const explanations = await generateAiExplanations(itemList, { vehicleModel, serviceCategory });
    return NextResponse.json({ explanations });
  } catch (error) {
    console.error('Error in /api/ai/explain:', error);
    return NextResponse.json({ error: 'Failed to generate technical explanations' }, { status: 500 });
  }
}
