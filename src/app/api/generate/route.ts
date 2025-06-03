import { NextRequest, NextResponse } from 'next/server';

// API key da Black Forest Labs
const API_KEY = process.env.API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Preparar o payload para a API da Black Forest Labs
    const payload = {
      prompt: body.prompt,
      input_image: body.input_image,
      seed: body.seed || 42,
      aspect_ratio: body.aspect_ratio || "1:1",
      output_format: body.output_format || "jpeg",
      prompt_upsampling: body.prompt_upsampling || false,
      safety_tolerance: body.safety_tolerance || 2
    };

    // Configurar a requisição para a API da Black Forest Labs
    const options = {
      method: 'POST',
      headers: {
        'x-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    // Fazer a requisição para a API da Black Forest Labs
    const response = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API da Black Forest Labs:', errorText);
      return NextResponse.json(
        { error: `Erro na API: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Retornar o resultado da API
    const result = await response.json();
    console.log(`Resposta da API BFL (Generate):`, JSON.stringify(result)); // Log detalhado da resposta
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
