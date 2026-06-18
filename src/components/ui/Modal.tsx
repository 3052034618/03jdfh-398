import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal = ({ open, onClose, title, children, footer }: ModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative horror-card w-full max-w-md mx-4 animate-slide-up shadow-2xl border-horror-accent/30">
        <div className="flex items-center justify-between p-4 border-b border-horror-border">
          <h3 className="font-cinzel text-base text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-horror-muted hover:text-white hover:bg-horror-surface2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">{children}</div>
        {footer && <div className="p-4 border-t border-horror-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
