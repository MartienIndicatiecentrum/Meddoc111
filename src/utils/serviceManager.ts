import { toast } from 'sonner';

interface ServiceStatus {
  backend: boolean;
  rag: boolean;
}

export class ServiceManager {
  private static instance: ServiceManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 10;
  private toastId: string | number | undefined;
  
  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }
  
  async checkServices(): Promise<ServiceStatus> {
    const status: ServiceStatus = {
      backend: false,
      rag: false
    };
    
    try {
      // Check backend health
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const backendResponse = await fetch('/health', { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);
      status.backend = backendResponse.ok;
    } catch (error) {
      status.backend = false;
    }
    
    try {
      // Check RAG server health
      const ragController = new AbortController();
      const ragTimeout = setTimeout(() => ragController.abort(), 5000);
      
      const ragResponse = await fetch('/rag/health', {
        method: 'GET',
        signal: ragController.signal
      });
      clearTimeout(ragTimeout);
      status.rag = ragResponse.ok;
    } catch (error) {
      status.rag = false;
    }
    
    return status;
  }
  
  async waitForServices(showToast: boolean = true): Promise<ServiceStatus> {
    const checkOnce = async (): Promise<ServiceStatus> => {
      return await this.checkServices();
    };
    
    // Initial check
    const initialStatus = await checkOnce();
    if (initialStatus.backend && initialStatus.rag) {
      if (showToast) {
        toast.success('All services are running', { duration: 3000 });
      }
      return initialStatus;
    }
    
    // Show initial message
    if (showToast) {
      this.toastId = toast.loading('Starting backend services...', { 
        duration: Infinity,
        description: 'This may take a few seconds'
      });
    }
    
    // Retry with exponential backoff
    return new Promise((resolve) => {
      const attemptConnection = async () => {
        this.retryCount++;
        
        const status = await checkOnce();
        
        // Update toast with current status
        if (showToast && this.toastId) {
          const backendText = status.backend ? '✓ Backend API' : '⏳ Backend API';
          const ragText = status.rag ? '✓ RAG Server' : '⏳ RAG Server';
          toast.loading(`Starting services...\n${backendText}\n${ragText}`, {
            id: this.toastId,
            duration: Infinity
          });
        }
        
        if (status.backend && status.rag) {
          if (showToast && this.toastId) {
            toast.success('All services are now running!', {
              id: this.toastId,
              duration: 3000
            });
          }
          this.retryCount = 0;
          resolve(status);
          return;
        }
        
        if (this.retryCount >= this.maxRetries) {
          if (showToast && this.toastId) {
            const message = !status.backend && !status.rag 
              ? 'Failed to start services'
              : !status.backend 
              ? 'Backend API failed to start' 
              : 'RAG Server failed to start';
              
            toast.error(message, {
              id: this.toastId,
              duration: 5000,
              description: 'Check console for details'
            });
          }
          this.retryCount = 0;
          resolve(status);
          return;
        }
        
        // Retry after delay (exponential backoff)
        const delay = Math.min(1000 * Math.pow(1.5, this.retryCount), 5000);
        setTimeout(attemptConnection, delay);
      };
      
      // Start checking after a short delay
      setTimeout(attemptConnection, 1500);
    });
  }
  
  // Check individual service
  async checkBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/health', { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  async checkRAG(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/rag/health', {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  // Get diagnostic information
  async getDiagnostics(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/diagnostic', {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}