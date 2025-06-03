import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const apiKey = '09555340-d26f-4299-9630-4c6ddf58251b';
    
    console.log('Recebendo solicitação para API da Black Forest Labs');
    
    // Configurar opções para a solicitação à API da Black Forest Labs
    const options = {
      method: 'POST',
      headers: {
        'x-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    console.log('Enviando solicitação para a API da Black Forest Labs');
    
    // Fazer a solicitação à API da Black Forest Labs
    const response = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', options);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('Resposta recebida da API');
    
    // Retornar a resposta da API para o cliente
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no processamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
