"use client";

import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    profession: '',
    guild: '',
    country: '',
    status: '',
  });

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/admin/dashboard?${params.toString()}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, status) => {
    const note = prompt('Agregar nota interna (opcional):');
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, note }),
      });
      
      if (response.ok) {
        fetchDashboard();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading && !data) {
    return <div className="flex justify-center py-8">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-red-500">Error loading dashboard</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Panel Administrativo</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Colaboradores</h3>
          <p className="text-3xl font-bold text-gray-900">{data.stats.totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Nuevos (30 días)</h3>
          <p className="text-3xl font-bold text-blue-600">{data.stats.newUsersThisMonth}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Inversores Potenciales</h3>
          <p className="text-3xl font-bold text-green-600">{data.stats.potentialInvestors}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Gremios</h3>
          <p className="text-3xl font-bold text-purple-600">{data.stats.guilds}</p>
        </div>
      </div>

      {/* Specialty Distribution */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Abogados</h3>
          <p className="text-2xl font-bold">{data.stats.lawyers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Economistas</h3>
          <p className="text-2xl font-bold">{data.stats.economists}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Programadores</h3>
          <p className="text-2xl font-bold">{data.stats.programmers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Categorías</h3>
          <p className="text-2xl font-bold">{data.stats.categories}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <input
            type="text"
            name="search"
            placeholder="Buscar..."
            value={filters.search}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded"
          />
          <input
            type="text"
            name="profession"
            placeholder="Profesión"
            value={filters.profession}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded"
          />
          <input
            type="text"
            name="country"
            placeholder="País"
            value={filters.country}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded"
          >
            <option value="">Todos los estados</option>
            <option value="registered">Registrado</option>
            <option value="reviewing">En revisión</option>
            <option value="approved">Incorporado</option>
            <option value="active">Colaborador activo</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', profession: '', guild: '', country: '', status: '' })}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gremios</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Habilidades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.profile?.profession || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.profile?.country || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full
                      ${user.profile?.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      ${user.profile?.status === 'approved' ? 'bg-blue-100 text-blue-800' : ''}
                      ${user.profile?.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${user.profile?.status === 'registered' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {user.profile?.status || 'registered'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.guildMemberships?.map(gm => gm.guild.name).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.skills?.map(s => s.name).slice(0, 3).join(', ')}
                    {user.skills && user.skills.length > 3 && ` +${user.skills.length - 3} más`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={user.profile?.status || 'registered'}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="registered">Registrado</option>
                      <option value="reviewing">En revisión</option>
                      <option value="approved">Incorporado</option>
                      <option value="active">Colaborador activo</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No se encontraron colaboradores con los filtros actuales.
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="mt-4 flex justify-end">
        <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Exportar Datos
        </button>
      </div>
    </div>
  );
}