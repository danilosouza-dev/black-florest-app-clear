import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    const apiKey = '09555340-d26f-4299-9630-4c6ddf58251b';
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'ID da tarefa não fornecido' },
        { status: 400 }
      );
    }
    
    console.log(`Fazendo polling para o ID da tarefa: ${taskId}`);
    
    // Construir a URL de polling com o ID da tarefa
    const pollingUrl = `https://api.bfl.ai/v1/flux-kontext-pro/${taskId}`;
    
    // Fazer a solicitação à API da Black Forest Labs
    const response = await fetch(pollingUrl, {
      headers: {
        'x-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro no polling: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('Resposta de polling recebida');
    
    // Retornar a resposta da API para o cliente
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no polling:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer polling' },
      { status: 500 }
    );
  }
}
