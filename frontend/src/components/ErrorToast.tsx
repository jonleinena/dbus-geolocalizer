import { useEffect, useState } from 'react';

interface ErrorToastProps {
  message: string | null;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function ErrorToast({ message, onDismiss, autoDismissMs = 10000 }: ErrorToastProps) {
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setVisible(true);
    }
  }, [message]);

  useEffect(() => {
    if (!visible || !autoDismissMs) return;

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentMessage(null);
        onDismiss?.();
      }, 300);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setCurrentMessage(null);
      onDismiss?.();
    }, 300);
  };

  if (!currentMessage) return null;

  return (
    <div className={`error-toast ${visible ? 'visible' : ''}`}>
      <div className="error-toast-content">
        <div className="error-toast-icon">⚠️</div>
        <div className="error-toast-text">
          <span className="error-toast-title">Error de conexión</span>
          <span className="error-toast-message">{getErrorMessage(currentMessage)}</span>
        </div>
        <button className="error-toast-close" onClick={handleDismiss} aria-label="Cerrar">
          ✕
        </button>
      </div>
      <div className="error-toast-hint">
        El servicio DBUS puede estar temporalmente fuera de servicio. Reintentando automáticamente...
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  if (error.includes('Failed to fetch') || error.includes('NetworkError')) {
    return 'No se pudo conectar con el servidor';
  }
  if (error.includes('fetch')) {
    return 'Error al obtener datos del servidor';
  }
  if (error.includes('timeout')) {
    return 'La conexión ha tardado demasiado';
  }
  return error;
}
