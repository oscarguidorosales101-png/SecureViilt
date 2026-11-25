// ==============================================================================
// SECUREVAULT - PANEL PERSONAL Y DASHBOARD DE NOTAS CIFRADAS (ESTILO ANCHOR)
// ==============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Pin,
  FileText,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { notesService } from '../../services/notesService';
import { NoteModal } from '../../components/notes/NoteModal';
import styles from './NotesDashboard.module.css';

const TAG_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' },
  { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' },
  { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)' },
  { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' },
  { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' },
  { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' },
];

const extractTags = (text) => {
  if (!text) return [];
  const matches = text.match(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g);
  return matches ? Array.from(new Set(matches.map((m) => m.slice(1)))) : [];
};

export const NotesDashboardPage = ({ searchQuery = '', selectedTag = null, onTagsComputed, isModalOpen, setIsModalOpen }) => {
  const [notes, setNotes] = useState([]);
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('securevault_pinned_notes') || '[]');
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notesService.getAll();
      setNotes(data.notes || []);
    } catch {
      setError('No se pudieron cargar las notas cifradas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (location.state?.openNewModal) {
      setEditingNote(null);
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, setIsModalOpen]);

  // Extraer tags de todas las notas para la barra lateral
  useEffect(() => {
    if (onTagsComputed && notes.length > 0) {
      const tagMap = {};
      notes.forEach((n) => {
        const noteTags = extractTags(n.content);
        noteTags.forEach((t) => {
          tagMap[t] = (tagMap[t] || 0) + 1;
        });
      });
      const list = Object.entries(tagMap).map(([tag, count]) => ({ tag, count }));
      onTagsComputed(list);
    }
  }, [notes, onTagsComputed]);

  const handleSaveNote = async (notePayload) => {
    const { isPinned, ...apiPayload } = notePayload;
    let savedNoteId = null;

    if (editingNote) {
      await notesService.update(editingNote.id, apiPayload);
      savedNoteId = editingNote.id;
    } else {
      const res = await notesService.create(apiPayload);
      savedNoteId = res.note?.id || res.data?.note?.id;
    }

    if (savedNoteId) {
      setPinnedIds((prev) => {
        let updated;
        if (isPinned && !prev.includes(savedNoteId)) {
          updated = [...prev, savedNoteId];
        } else if (!isPinned && prev.includes(savedNoteId)) {
          updated = prev.filter((id) => id !== savedNoteId);
        } else {
          updated = prev;
        }
        localStorage.setItem('securevault_pinned_notes', JSON.stringify(updated));
        return updated;
      });
    }

    await fetchNotes();
  };

  const handleTogglePin = (e, noteId) => {
    e.stopPropagation();
    setPinnedIds((prev) => {
      const updated = prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId];
      localStorage.setItem('securevault_pinned_notes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteNote = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar esta nota cifrada de forma permanente?')) return;
    try {
      await notesService.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setPinnedIds((prev) => {
        const updated = prev.filter((pinnedId) => pinnedId !== id);
        localStorage.setItem('securevault_pinned_notes', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const enrichedNotes = useMemo(() => {
    return notes.map((n) => ({
      ...n,
      isPinned: pinnedIds.includes(n.id),
      tags: extractTags(n.content),
    }));
  }, [notes, pinnedIds]);

  const filteredNotes = useMemo(() => {
    return enrichedNotes.filter((note) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        !selectedTag ||
        note.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      return matchesSearch && matchesTag;
    });
  }, [enrichedNotes, searchQuery, selectedTag]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  const getTagStyle = (tagStr) => {
    let hash = 0;
    for (let i = 0; i < tagStr.length; i++) {
      hash = tagStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_COLORS.length;
    return TAG_COLORS[index];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span>Cargando y descifrando notas seguras...</span>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.summaryStatsBar}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{notes.length}</div>
            <div className={styles.statTitle}>Total Encrypted Notes</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Pin size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{pinnedNotes.length}</div>
            <div className={styles.statTitle}>Pinned Notes</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className={styles.statValue} style={{ fontSize: '1.2rem' }}>AES-256-GCM</div>
            <div className={styles.statTitle}>Cryptographic Storage</div>
          </div>
        </div>

        <div
          className={styles.statCard}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
        >
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}>
            <Lock size={22} />
          </div>
          <div>
            <div className={styles.statValue} style={{ fontSize: '1.15rem' }}>Bóveda Privada</div>
            <div className={styles.statTitle}>Gestionar Perfil & Secretos →</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {filteredNotes.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={42} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          <h2 className={styles.emptyTitle}>
            {searchQuery || selectedTag ? 'No se encontraron notas con estos filtros' : 'Aún no tienes notas cifradas'}
          </h2>
          <p className={styles.emptySubtitle}>
            {searchQuery || selectedTag
              ? 'Prueba a cambiar tus términos de búsqueda o selecciona otra etiqueta.'
              : 'Tus notas se almacenarán con cifrado militar AES-256-GCM, protegidas contra intrusiones.'}
          </p>
          {!searchQuery && !selectedTag && (
            <button
              className={styles.createFirstNoteBtn}
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Crear mi primera nota</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {pinnedNotes.length > 0 && (
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <Pin size={14} style={{ transform: 'rotate(45deg)' }} />
                  <span>PINNED ({pinnedNotes.length})</span>
                </div>
              </div>

              <div className={styles.notesGrid}>
                {pinnedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={styles.noteCard}
                    onClick={() => {
                      setEditingNote(note);
                      setIsModalOpen(true);
                    }}
                  >
                    <div>
                      <div className={styles.noteCardHeader}>
                        <h3 className={styles.noteCardTitle}>{note.title}</h3>
                        <button
                          className={`${styles.pinIconBtn} ${styles.pinIconPinned}`}
                          title="Desanclar nota"
                          onClick={(e) => handleTogglePin(e, note.id)}
                        >
                          <Pin size={16} />
                        </button>
                      </div>
                      <p className={styles.noteSnippet}>{note.content}</p>
                    </div>

                    <div>
                      {note.tags.length > 0 && (
                        <div className={styles.tagsWrapper} style={{ marginBottom: '0.65rem' }}>
                          {note.tags.map((t) => {
                            const style = getTagStyle(t);
                            return (
                              <span
                                key={t}
                                className={styles.noteTag}
                                style={{ backgroundColor: style.bg, color: style.text, border: style.border }}
                              >
                                {t}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className={styles.noteCardFooter}>
                        <span className={styles.noteDate}>{formatDate(note.createdAt)}</span>
                        <div className={styles.cardActionBtns}>
                          <button
                            className={styles.actionBtn}
                            title="Editar nota"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNote(note);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            title="Eliminar nota"
                            onClick={(e) => handleDeleteNote(e, note.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <FileText size={14} />
                <span>
                  {pinnedNotes.length > 0 ? `ALL NOTES (${otherNotes.length})` : `ALL NOTES (${filteredNotes.length})`}
                </span>
              </div>
            </div>

            <div className={styles.notesGrid}>
              {(pinnedNotes.length > 0 ? otherNotes : filteredNotes).map((note) => (
                <div
                  key={note.id}
                  className={styles.noteCard}
                  onClick={() => {
                    setEditingNote(note);
                    setIsModalOpen(true);
                  }}
                >
                  <div>
                    <div className={styles.noteCardHeader}>
                      <h3 className={styles.noteCardTitle}>{note.title}</h3>
                      <button
                        className={styles.pinIconBtn}
                        title="Fijar nota al inicio"
                        onClick={(e) => handleTogglePin(e, note.id)}
                      >
                        <Pin size={16} />
                      </button>
                    </div>
                    <p className={styles.noteSnippet}>{note.content}</p>
                  </div>

                  <div>
                    {note.tags.length > 0 && (
                      <div className={styles.tagsWrapper} style={{ marginBottom: '0.65rem' }}>
                        {note.tags.map((t) => {
                          const style = getTagStyle(t);
                          return (
                            <span
                              key={t}
                              className={styles.noteTag}
                              style={{ backgroundColor: style.bg, color: style.text, border: style.border }}
                            >
                              {t}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className={styles.noteCardFooter}>
                      <span className={styles.noteDate}>{formatDate(note.createdAt)}</span>
                      <div className={styles.cardActionBtns}>
                        <button
                          className={styles.actionBtn}
                          title="Editar nota"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNote(note);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title="Eliminar nota"
                          onClick={(e) => handleDeleteNote(e, note.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        initialData={editingNote}
      />
    </div>
  );
};
