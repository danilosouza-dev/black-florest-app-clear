import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Obter o ID da tarefa da query string
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'ID da tarefa não fornecido' },
        { status: 400 }
      );
    }
    
    // API key da Black Forest Labs
    const API_KEY = process.env.API_KEY;
    
    // Configurar a requisição para verificar o status da tarefa
    const options = {
      method: 'GET',
      headers: {
        'x-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    // Fazer a requisição para a API da Black Forest Labs para verificar o status
    const response = await fetch(`https://api.bfl.ai/v1/flux-kontext-pro/${taskId}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao verificar status na API:', errorText);
      return NextResponse.json(
        { error: `Erro na API: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Retornar o resultado da verificação de status
    const result = await response.json();
    console.log(`Resposta da API BFL (Polling) para taskId ${taskId}:`, JSON.stringify(result)); // Log detalhado da resposta
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao processar requisição de polling:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
