import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para que el siguiente renderizado muestre la UI de respaldo
    return { 
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // También puedes registrar el error en un servicio de informes de errores
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de respaldo personalizada
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-100 rounded-lg my-4">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Algo salió mal
          </h2>
          <p className="text-red-600 mb-4">
            Ha ocurrido un error al cargar esta sección de la página.
          </p>
          <details className="text-sm text-gray-700 bg-white p-2 rounded">
            <summary>Ver detalles del error</summary>
            <pre className="p-2 mt-2 overflow-x-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
