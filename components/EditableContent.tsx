import React, { useState, useEffect, useRef } from 'react';

interface EditableContentProps {
  isAdmin?: boolean;
  value: string;
  onSave: (newValue: string) => void;
  type?: 'text' | 'textarea';
  className?: string; // Classes para o texto de visualização
  inputClassName?: string; // Classes extras para o input
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div' | 'button'; // Qual tag HTML renderizar
}

export const EditableContent: React.FC<EditableContentProps> = ({
  isAdmin,
  value,
  onSave,
  type = 'text',
  className = '',
  inputClassName = '',
  tag: Tag = 'span'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type === 'text') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(value); // Revert
    }
  };

  if (isEditing && isAdmin) {
    const commonClasses = `bg-black/50 border border-primary text-white p-1 rounded outline-none w-full ${inputClassName}`;
    
    if (type === 'textarea') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${commonClasses} min-h-[100px]`}
        />
      );
    }
    
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={commonClasses}
      />
    );
  }

  return (
    <Tag className={`relative group/edit ${className}`}>
      {value}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="ml-2 inline-flex items-center justify-center w-5 h-5 text-gray-400 bg-black/50 hover:bg-primary hover:text-white rounded-full transition-all opacity-0 group-hover/edit:opacity-100 absolute -right-6 top-1/2 -translate-y-1/2 z-50 cursor-pointer shadow-lg border border-white/10"
          title="Editar conteúdo"
        >
          <span className="material-icons-outlined text-[10px]">edit</span>
        </button>
      )}
    </Tag>
  );
};