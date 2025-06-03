'use client';

import { useState, useRef, ChangeEvent } from 'react';

// Tipos para as configurações do formulário
interface FormData {
  prompt: string;
  inputImage: string | null;
  seed: number | null;
  aspectRatio: string;
  outputFormat: 'jpeg' | 'png';
  promptUpsampling: boolean;
  safetyTolerance: number;
}

// Tipo para o resultado da API
interface ApiResult {
  id?: string;
  status?: string;
  output?: string;
  output_url?: string;
  error?: string;
  [key: string]: any;
}

// Componente principal
export default function Home() {
  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState<FormData>({
    prompt: '',
    inputImage: null,
    seed: null,
    aspectRatio: '1:1',
    outputFormat: 'jpeg',
    promptUpsampling: false,
    safetyTolerance: 2
  });

  // Estado para armazenar a URL da imagem de visualização
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Estado para controlar o carregamento da API
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para armazenar o resultado da API
  const [apiResult, setApiResult] = useState<ApiResult | null>(null); // Estado para armazenar resultado inicial da API
  
  // Estado para armazenar a imagem gerada
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Estado para armazenar logs
  const [logs, setLogs] = useState<string[]>([]);
  
  // Estado para controlar a exibição de configurações adicionais
  const [showSettings, setShowSettings] = useState(true);
  
  // Estado para controlar a exibição de logs
  const [showLogs, setShowLogs] = useState(false);
  
  // Estado para controlar o valor do guidance scale
  const [guidanceScale, setGuidanceScale] = useState(3.5);
  
  // Estado para controlar o número de imagens
  const [numImages, setNumImages] = useState(1);
  
  // Estado para controlar o modo de sincronização
  const [syncMode, setSyncMode] = useState(false);

  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para lidar com a mudança no input de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para lidar com a mudança no input de número
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
  };

  // Função para lidar com a mudança no input de checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Função para lidar com a mudança no input de arquivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, inputImage: base64String }));
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para gerar um seed aleatório
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setFormData(prev => ({ ...prev, seed: randomSeed }));
  };

  // Função para abrir o seletor de arquivo
  const handleChooseFile = () => {
    fileInputRef.current?.click()  // Função para fazer polling do resultado da API
  const pollForResult = async (pollUrl: string): Promise<ApiResult | null> => {
    try {
      addLog(`Iniciando polling para a URL: ${pollUrl}`);
      
      const maxAttempts = 30; // Máximo de tentativas de polling
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // Modificado para usar a URL de polling diretamente via API Route
        const response = await fetch(`/api/poll?pollUrl=${encodeURIComponent(pollUrl)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Erro no polling: ${response.status} ${response.statusText}` }));
          addLog(`Erro no polling: ${errorData.error || response.statusText}`);
          // Se for 404, pode ser que a tarefa ainda não esteja pronta ou o ID esteja errado
          if (response.status === 404) {
             addLog("Tarefa não encontrada ou ainda não iniciada na API. Tentando novamente...");
          }
          await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3 segundos
          continue;
        }
        
        const result = await response.json();
        addLog(`Resposta do polling: ${JSON.stringify(result)}`);
        
        // Verifica se o processamento foi concluído (status "Ready" conforme JSON do usuário)
        if (result.status === 'Ready' && result.result?.sample) {
          addLog('Processamento concluído com sucesso!');
          setGeneratedImage(result.result.sample); // Pega a URL do campo result.sample
          return result;
        } else if (result.status === 'failed') {
          addLog(`Processamento falhou: ${result.error || result.details || 'Erro desconhecido'}`);
          return null;
        } else if (result.status === 'processing' || result.status === 'pending') {
           addLog(`Status atual: ${result.status}. Tentando novamente em 3 segundos...`);
        } else {
           addLog(`Status inesperado: ${result.status}. Tentando novamente em 3 segundos...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3 segundos
      }
      
      addLog("Número máximo de tentativas de polling atingido.");
      return null;
    } catch (error) {
      console.error("Erro durante o polling:", error);
      addLog(`Erro fatal durante o polling: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };
  // Função para enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedImage(null);
    setApiResult(null);
    
    addLog(`Iniciando requisição para Black Forest Labs API`);
    addLog(`Prompt: ${formData.prompt}`);

    try {
      // Prepara o payload para a API
      const payload: Record<string, any> = {
        prompt: formData.prompt,
        seed: formData.seed,
        aspect_ratio: formData.aspectRatio,
        output_format: formData.outputFormat,
        prompt_upsampling: formData.promptUpsampling,
        safety_tolerance: formData.safetyTolerance
      };
      
      // Adiciona a imagem se existir
      if (formData.inputImage) {
        // Extrai apenas a parte base64 da string (remove o prefixo data:image/...)
        const base64Data = formData.inputImage.split(',')[1];
        payload.input_image = base64Data;
      }
      
      addLog(`Preparando payload: ${JSON.stringify(payload)}`);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      };

      addLog('Enviando requisição para a API...');
      
      // Código real para produção com API Routes
      const response = await fetch('/api/generate', options);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setApiResult(result);
      addLog(`Requisição enviada com sucesso! Resposta da API Generate: ${JSON.stringify(result)}`); // Log da resposta completa
      
      // Se a API retornar um polling_url, inicia o polling
      if (result.polling_url) {
        addLog(`Polling URL recebida: ${result.polling_url}. Iniciando polling...`);
        const resultData = await pollForResult(result.polling_url); // Passa a polling_url
        if (resultData) {
          // O resultado final já é tratado dentro de pollForResult
        }
      } else if (syncMode && result.output) {
        // Se estiver em modo síncrono e houver output direto
        addLog('Recebido resultado em modo síncrono');
        setGeneratedImage(result.output);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao enviar requisição:', error);
      addLog(`Erro ao enviar requisição: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  // Função para adicionar log
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Função para resetar o formulário
  const handleReset = () => {
    setFormData({
      prompt: '',
      inputImage: null,
      seed: null,
      aspectRatio: '1:1',
      outputFormat: 'jpeg',
      promptUpsampling: false,
      safetyTolerance: 2
    });
    setPreviewImage(null);
    setApiResult(null);
    setGeneratedImage(null);
    setGuidanceScale(3.5);
    setNumImages(1);
    setSyncMode(false);
    setLogs([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Coluna de Input */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Input</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo de Prompt */}
          <div className="mb-4">
            <label htmlFor="prompt" className="flex items-center text-foreground">
              Prompt
              <span className="info-icon" title="Texto descritivo para geração da imagem">
                ⓘ
              </span>
            </label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleInputChange}
              className="input min-h-[100px]"
              placeholder="Coloque sua descrição aqui..."
              required
            />
          </div>

          {/* Campo de URL da Imagem */}
          <div className="mb-4">
            <label htmlFor="imageUrl" className="flex items-center text-foreground">
              Image URL
              <span className="info-icon" title="URL da imagem ou upload de arquivo">
                ⓘ
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="imageUrl"
                className="input flex-grow"
                placeholder="https://exemplo.com/imagem.jpg"
                disabled={!!previewImage}
              />
              <button
                type="button"
                onClick={handleChooseFile}
                className="btn-secondary whitespace-nowrap"
              >
                Escolher...
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />
            <p className="text-xs text-secondary-foreground mt-1">
              Dica: você pode arrastar e soltar arquivo(s) aqui, ou fornecer uma URL base64 codificada. Formatos aceitos: jpg, jpeg, png, webp, gif, avif
            </p>
            
            {/* Preview da imagem */}
            {previewImage && (
              <div className="mt-3 relative border border-border rounded-md p-1 inline-block">
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center"
                  onClick={() => {
                    setPreviewImage(null);
                    setFormData(prev => ({ ...prev, inputImage: null }));
                  }}
                >
                  ✕
                </button>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-h-[150px] rounded"
                />
              </div>
            )}
          </div>

          {/* Configurações adicionais */}
          <div className="mb-4">
            <div className="section-header">
              <h3 className="text-md font-medium">Configurações Adicionais</h3>
              <button 
                type="button" 
                className="text-sm text-secondary-foreground px-2 py-1 rounded bg-secondary/50"
                onClick={() => setShowSettings(!showSettings)}
              >
                {showSettings ? 'Menos ▲' : 'Mais ▼'}
              </button>
            </div>

            {showSettings && (
              <>
                {/* Seed */}
                <div className="mt-3">
                  <label htmlFor="seed" className="flex items-center text-foreground">
                    Seed
                    <span className="info-icon" title="Valor para reproduzir resultados consistentes">
                      ⓘ
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="seed"
                      name="seed"
                      value={formData.seed === null ? '' : formData.seed}
                      onChange={handleNumberChange}
                      className="input"
                      placeholder="random"
                    />
                    <button 
                      type="button" 
                      className="btn-secondary w-10 h-10 flex items-center justify-center p-0"
                      onClick={generateRandomSeed}
                    >
                      ↻
                    </button>
                  </div>
                </div>

                {/* Guidance Scale */}
                <div className="mt-3">
                  <label htmlFor="guidanceScale" className="flex items-center text-foreground">
                    Guidance scale (CFG)
                    <span className="info-icon" title="Controla o quanto o modelo segue o prompt">
                      ⓘ
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      id="guidanceScale"
                      min="0"
                      max="10"
                      step="0.1"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                      className="w-full slider-purple"
                    />
                    <input
                      type="number"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                      className="input w-16 text-center"
                      min="0"
                      max="10"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Sync Mode */}
                <div className="mt-3">
                  <label className="flex items-center text-foreground">
                    Sync Mode
                    <span className="info-icon" title="Modo de sincronização">
                      ⓘ
                    </span>
                  </label>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="syncMode" 
                      checked={syncMode}
                      onChange={(e) => setSyncMode(e.target.checked)}
                      className="mr-2 accent-primary" 
                    />
                    <label htmlFor="syncMode" className="text-sm">Ativado</label>
                  </div>
                  <p className="text-xs text-secondary-foreground mt-1">
                    Nota: Quando "sync_mode" é "true", a mídia será retornada como um Base64 URL e os dados de saída não estarão disponíveis no histórico de requisições.
                  </p>
                </div>

                {/* Num Images */}
                <div className="mt-3">
                  <label htmlFor="numImages" className="flex items-center text-foreground">
                    Num Images
                    <span className="info-icon" title="Número de imagens a serem geradas">
                      ⓘ
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      id="numImages"
                      min="1"
                      max="4"
                      step="1"
                      value={numImages}
                      onChange={(e) => setNumImages(parseInt(e.target.value))}
                      className="w-full slider-purple"
                    />
                    <input
                      type="number"
                      value={numImages}
                      onChange={(e) => setNumImages(parseInt(e.target.value))}
                      className="input w-16 text-center"
                      min="1"
                      max="4"
                    />
                  </div>
                </div>

                {/* Safety Tolerance */}
                <div className="mt-3">
                  <label htmlFor="safetyTolerance" className="flex items-center text-foreground">
                    Safety Tolerance
                    <span className="api-badge">API only</span>
                  </label>
                  <div className="flex items-center">
                    <select
                      id="safetyTolerance"
                      name="safetyTolerance"
                      value={formData.safetyTolerance}
                      onChange={handleNumberChange}
                      className="input"
                    >
                      <option value="0">0 (Mais restrito)</option>
                      <option value="1">1</option>
                      <option value="2">2 (Padrão)</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6 (Menos restrito)</option>
                    </select>
                  </div>
                  <p className="text-xs text-secondary-foreground mt-1">
                    Esta propriedade está disponível apenas através de chamadas de API.
                  </p>
                </div>

                {/* Output Format */}
                <div className="mt-3">
                  <label htmlFor="outputFormat" className="flex items-center text-foreground">
                    Output Format
                    <span className="info-icon" title="Formato de saída da imagem">
                      ⓘ
                    </span>
                  </label>
                  <select
                    id="outputFormat"
                    name="outputFormat"
                    value={formData.outputFormat}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="jpeg">jpeg</option>
                    <option value="png">png</option>
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div className="mt-3">
                  <label htmlFor="aspectRatio" className="flex items-center text-foreground">
                    Aspect Ratio
                    <span className="info-icon" title="Proporção da imagem">
                      ⓘ
                    </span>
                  </label>
                  <select
                    id="aspectRatio"
                    name="aspectRatio"
                    value={formData.aspectRatio}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : 'Executar'}
              {!isLoading && <span className="text-xs border border-white/30 rounded px-1">ctrl + ↵</span>}
            </button>
          </div>
        </form>
      </div>

      {/* Coluna de Resultado */}
      <div className="card">
        <div className="section-header">
          <h2 className="text-xl font-semibold">Resultado</h2>
          <span className="status-badge">
            {isLoading ? 'Processando...' : generatedImage ? 'Concluído' : 'Aguardando'}
          </span>
        </div>

        <div className="result-container">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-secondary-foreground">Processando sua solicitação...</p>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full">
              <img 
                src={generatedImage} 
                alt="Imagem gerada" 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="text-center text-secondary-foreground">
              <p>Preencha o formulário e clique em Executar para ver o resultado</p>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="mt-6">
          <div className="section-header">
            <h3 className="text-md font-medium">Logs</h3>
            <button 
              type="button"
              className="text-sm text-secondary-foreground px-2 py-1 rounded bg-secondary/50"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? 'Ocultar ▲' : 'Mostrar ▼'}
            </button>
          </div>
          
          {showLogs && (
            <div className="log-container">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    {log}
                  </div>
                ))
              ) : (
                <p className="text-secondary-foreground">Nenhum log disponível</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
