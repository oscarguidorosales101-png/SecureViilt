// ==============================================================================
// SECUREVAULT - PANEL DE ADMINISTRACIÓN Y AUDITORÍA FORENSE (ESTILO CLOUISLE)
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Activity,
  CheckCircle,
  AlertOctagon,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminDashboard.module.css';

export const AdminDashboardPage = () => {
  const { user: currentAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'users'
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Cargar usuarios
  const loadUsers = useCallback(async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);

  // Cargar registros de auditoría
  const loadLogs = useCallback(async () => {
    try {
      const params = { page, limit: 50 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (actionFilter !== 'ALL') params.action = actionFilter;
      const data = await adminService.getAuditLogs(params);
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  }, [page, statusFilter, actionFilter]);

  // Carga inicial
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadLogs()]);
    setLoading(false);
  }, [loadUsers, loadLogs]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Manejo de activación / desactivación de usuario
  const handleToggleUserStatus = async (user) => {
    if (user.id === currentAdmin.id) {
      alert('Por seguridad no puedes desactivar tu propia cuenta administradora.');
      return;
    }

    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus
      ? `¿Deseas activar la cuenta de ${user.email}?`
      : `¿Deseas desactivar la cuenta de ${user.email}? Todas sus sesiones activas serán revocadas inmediatamente.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      await adminService.updateUserStatus(user.id, nextStatus);
      await loadUsers();
      await loadLogs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error al actualizar estado del usuario.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cálculo de Métricas (Attachment 4 Clouisle style)
  const metrics = useMemo(() => {
    const totalLogs = pagination.total || logs.length;

    // Calcular logs de hoy
    const today = new Date().toISOString().slice(0, 10);
    const todayLogsCount = logs.filter((l) => l.createdAt?.slice(0, 10) === today).length;

    // Operaciones fallidas o bloqueadas
    const failedOpsCount = logs.filter((l) => l.status === 'FAILURE' || l.status === 'BLOCKED').length;

    // Usuarios activos
    const activeUsersCount = users.filter((u) => u.isActive).length;

    return {
      totalLogs,
      todayLogs: todayLogsCount,
      failedOps: failedOpsCount,
      activeUsers: activeUsersCount,
    };
  }, [pagination.total, logs, users]);

  // Filtro de búsqueda en memoria para la tabla de logs
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(
      (log) =>
        (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
        (log.action && log.action.toLowerCase().includes(term)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(term)) ||
        (log.resourceType && log.resourceType.toLowerCase().includes(term))
    );
  }, [logs, searchTerm]);

  // Formato de fecha
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  };

  const getStatusBadge = (status) => {
    if (status === 'SUCCESS') {
      return <span className="badge badge-emerald">SUCCESS</span>;
    }
    if (status === 'FAILURE') {
      return <span className="badge badge-rose">FAILURE</span>;
    }
    if (status === 'BLOCKED') {
      return <span className="badge badge-amber">BLOCKED</span>;
    }
    return <span className="badge badge-blue">{status}</span>;
  };

  const getOperationBadge = (action) => {
    if (action.includes('LOGIN') || action.includes('AUTH') || action.includes('LOGOUT')) {
      return <span className="badge badge-blue">Auth</span>;
    }
    if (action.includes('CREATE') || action.includes('REGISTER')) {
      return <span className="badge badge-emerald">Create</span>;
    }
    if (action.includes('UPDATE') || action.includes('STATUS')) {
      return <span className="badge badge-amber">Update</span>;
    }
    if (action.includes('DELETE')) {
      return <span className="badge badge-rose">Delete</span>;
    }
    if (action.includes('REVEAL')) {
      return <span className="badge badge-purple">Reveal</span>;
    }
    return <span className="badge badge-blue">System</span>;
  };

  return (
    <div className={styles.adminContainer}>
      <header className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className={styles.pageTitle}>
              <ShieldAlert size={28} className="text-blue-500" />
              <span>Audit Logs & System Administration</span>
            </h1>
            <p className={styles.pageSubtitle}>
              View and manage system audit logs for security, compliance, and user identity governance.
            </p>
          </div>

          <button
            onClick={refreshAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#141b2a',
              border: '1px solid #23304a',
              color: '#ffffff',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* 4 Tarjetas de Métricas estilo Clouisle (Attachment 4) */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricTitle}>Total Logs</span>
            <Activity className={styles.metricIcon} size={18} />
          </div>
          <div>
            <div className={styles.metricValue}>{metrics.totalLogs}</div>
            <div className={styles.metricSubtitle}>All time audit records</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricTitle}>Today's Logs</span>
            <CheckCircle className={styles.metricIcon} size={18} />
          </div>
          <div>
            <div className={styles.metricValue}>{metrics.todayLogs}</div>
            <div className={styles.metricSubtitle}>Records generated today</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricTitle}>Failed Operations</span>
            <AlertOctagon className={styles.metricIcon} size={18} style={{ color: metrics.failedOps > 0 ? '#f87171' : undefined }} />
          </div>
          <div>
            <div className={styles.metricValue} style={{ color: metrics.failedOps > 0 ? '#f87171' : '#ffffff' }}>
              {metrics.failedOps}
            </div>
            <div className={styles.metricSubtitle}>Failed or blocked security events</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricCardHeader}>
            <span className={styles.metricTitle}>Active Users</span>
            <Users className={styles.metricIcon} size={18} />
          </div>
          <div>
            <div className={styles.metricValue}>{metrics.activeUsers}</div>
            <div className={styles.metricSubtitle}>Accounts currently active</div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación Interna */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Activity size={16} />
          <span>Audit Logs ({pagination.total})</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>User Accounts ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: BITÁCORA FORENSE DE AUDITORÍA */}
      {activeTab === 'logs' && (
        <>
          {/* Barra de Filtros estilo Clouisle */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} size={15} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by user, IP address, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                className={styles.selectDropdown}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Filter by Status: All</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>

              <select
                className={styles.selectDropdown}
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Filter by Action: All</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
                <option value="USER_REGISTER">USER_REGISTER</option>
                <option value="NOTE_CREATE">NOTE_CREATE</option>
                <option value="NOTE_UPDATE">NOTE_UPDATE</option>
                <option value="NOTE_DELETE">NOTE_DELETE</option>
                <option value="SENSITIVE_DATA_REVEAL">SENSITIVE_DATA_REVEAL</option>
                <option value="USER_STATUS_UPDATE">USER_STATUS_UPDATE</option>
              </select>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className={styles.tableCard}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)', gap: '0.75rem' }}>
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span>Cargando registros forenses de seguridad...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No se encontraron registros de auditoría coincidentes.
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource Type</th>
                    <th>IP Address</th>
                    <th>Operation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className={styles.timeCell}>{formatDateTime(log.createdAt)}</td>
                      <td className={styles.userCell}>{log.userEmail || 'Anon / System'}</td>
                      <td>{log.action}</td>
                      <td>
                        <code style={{ fontSize: '0.8rem', color: '#93c5fd' }}>{log.resourceType || 'system'}</code>
                      </td>
                      <td className={styles.ipCell}>{log.ipAddress || '127.0.0.1'}</td>
                      <td>{getOperationBadge(log.action)}</td>
                      <td>{getStatusBadge(log.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Paginación */}
            <div className={styles.paginationRow}>
              <span>
                Página {pagination.page} de {pagination.pages || 1} (Total: {pagination.total} registros)
              </span>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Anterior
                </button>
                <button
                  className={styles.pageBtn}
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: GESTIÓN DE CUENTAS DE USUARIO */}
      {activeTab === 'users' && (
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Intentos Fallidos</th>
                <th>Bloqueo Temporal</th>
                <th>Fecha Creación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentAdmin.id;
                const isLocked = u.lockoutUntil && new Date(u.lockoutUntil) > new Date();

                return (
                  <tr key={u.id}>
                    <td className={styles.userCell}>
                      {u.email} {isSelf && <span style={{ fontSize: '0.72rem', color: '#60a5fa' }}>(Tú)</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-emerald">Activo</span>
                      ) : (
                        <span className="badge badge-rose">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {u.failedLoginAttempts || 0} / 5
                      </span>
                    </td>
                    <td>
                      {isLocked ? (
                        <span className="badge badge-rose">
                          Bloqueado hasta {new Date(u.lockoutUntil).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ninguno</span>
                      )}
                    </td>
                    <td className={styles.timeCell}>{formatDateTime(u.createdAt)}</td>
                    <td>
                      {isSelf ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protegido</span>
                      ) : (
                        <button
                          className={`${styles.toggleStatusBtn} ${u.isActive ? styles.btnDeactivate : styles.btnActivate}`}
                          disabled={actionLoadingId === u.id}
                          onClick={() => handleToggleUserStatus(u)}
                        >
                          {actionLoadingId === u.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : u.isActive ? (
                            <>
                              <UserX size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              Activar
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
