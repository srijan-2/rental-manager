import { createContext, useContext } from 'react';
import { Language } from '../i18n';

export interface ShareRequest {
  recipientName: string;
  phone?: string;
  defaultLanguage: Language;
  buildMessage: (language: Language) => string;
  onSent?: () => void;
  rememberLanguage?: (language: Language) => void;
}

export const WhatsAppShareContext = createContext<{
  share: (request: ShareRequest) => void;
} | null>(null);

export function useWhatsAppShare() {
  const context = useContext(WhatsAppShareContext);
  if (!context) throw new Error('useWhatsAppShare must be used inside WhatsAppShareProvider');
  return context;
}
