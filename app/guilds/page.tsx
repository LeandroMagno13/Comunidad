import React, { useState, useEffect } from 'react';
import { Guild, GuildMembership } from '@/src/types/models';

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    try {
      const response = await fetch('/api/guilds');
      const data = await response.json();
      setGuilds(data);
    } catch (error) {
      console.error('Error fetching guilds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const guildData = {
      name: formData.get('name'),
      description: formData.get('description'),
      purpose: formData.get('purpose'),
    };

    try {
      const response = await fetch('/api/guilds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guildData),
      });
      
      if (response.ok) {
        const newGuild = await response.json();
        setGuilds([...guilds, newGuild]);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating guild:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading guilds...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gremios (Guilds)</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Crear Gremio'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-100 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Crear Nuevo Gremio</h2>
          <form onSubmit={handleCreateGuild} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                name="description"
                required
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Propósito</label>
              <textarea
                name="purpose"
                className="w-full px-3 py-2 border rounded"
                rows={2}
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Crear Gremio
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {guilds.map((guild) => (
          <div key={guild.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">{guild.name}</h3>
            <p className="text-gray-600 mb-4">{guild.description}</p>
            {guild.purpose && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-800">Propósito:</h4>
                <p className="text-sm text-gray-600">{guild.purpose}</p>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>{guild.members?.length || 0} miembros</span>
              <span>{guild.projects?.length || 0} proyectos</span>
              <span>{guild.discussions?.length || 0} discusiones</span>
            </div>
          </div>
        ))}
      </div>

      {guilds.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No hay gremios disponibles. ¡Sé el primero en crear uno!
        </div>
      )}
    </div>
  );
}
