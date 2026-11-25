// ==============================================================================
// SECUREVAULT - MODAL DE CREACIÓN Y EDICIÓN DE NOTA CIFRADA (AES-256-GCM)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import styles from './NoteModal.module.css';

const extractTags = (text) => {
  if (!text) return [];
  const matches = text.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
};

export const NoteModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      const existingTags = extractTags(initialData.content);
      setTagsInput(existingTags.join(', '));
      setIsPinned(!!initialData.isPinned);
    } else {
      setTitle('');
      setContent('');
      setTagsInput('');
      setIsPinned(false);
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('El título y el contenido son obligatorios.');
      return;
    }

    let finalContent = content.trim();
    if (tagsInput.trim()) {
      const enteredTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const existingTags = extractTags(finalContent);
      const missingTags = enteredTags.filter((t) => !existingTags.includes(t));
      if (missingTags.length > 0) {
        finalContent += '\n\n' + missingTags.map((t) => `#${t}`).join(' ');
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        title: title.trim(),
        content: finalContent,
        isPinned,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al guardar la nota cifrada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Lock size={20} className="text-blue-500" />
            <span>{initialData ? 'Edit Encrypted Note' : 'New Encrypted Note'}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.securityNotice}>
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Cifrado en Reposo Activo:</strong> El título y contenido serán cifrados
                mediante <code>AES-256-GCM</code> con un vector de inicialización único (IV) y tag de autenticación.
              </div>
            </div>

            {error && (
              <div style={{
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="noteTitle">Title</label>
              <input
                id="noteTitle"
                type="text"
                required
                className={styles.inputField}
                placeholder="Título descriptivo..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="noteContent">Content</label>
              <textarea
                id="noteContent"
                required
                className={styles.textareaField}
                placeholder="Escribe tu nota privada protegida..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="noteTags">Tags (separados por coma)</label>
              <input
                id="noteTags"
                type="text"
                className={styles.inputField}
                placeholder="Personal, Finanzas, Trabajo, Ideas..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <label className={styles.pinToggleRow}>
              <input
                type="checkbox"
                className={styles.pinCheckbox}
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span>Fijar al inicio del panel (Pinned Note)</span>
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Encrypting...
                </>
              ) : (
                'Save Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
