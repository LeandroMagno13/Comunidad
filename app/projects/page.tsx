"use client";

import React, { useState, useEffect } from 'react';
import { Project } from '@/src/types/models';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const projectData = {
      title: formData.get('title'),
      description: formData.get('description'),
      objectives: formData.get('objectives'),
      status: formData.get('status'),
      guildIds: [], // TODO: Add guild selection
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading projects...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Proyectos</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Crear Proyecto'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-100 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Crear Nuevo Proyecto</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <input
                type="text"
                name="title"
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
              <label className="block text-sm font-medium mb-1">Objetivos</label>
              <textarea
                name="objectives"
                className="w-full px-3 py-2 border rounded"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                name="status"
                defaultValue="investigation"
                className="w-full px-3 py-2 border rounded"
              >
                <option value="investigation">Investigación</option>
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="on-hold">En espera</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Crear Proyecto
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
            <p className="text-gray-600 mb-4">{project.description}</p>
            {project.objectives && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-800">Objetivos:</h4>
                <p className="text-sm text-gray-600">{project.objectives}</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium
                ${project.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                ${project.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                ${project.status === 'investigation' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${project.status === 'on-hold' ? 'bg-red-100 text-red-800' : ''}
              `}
              >
                {project.status}
              </span>
              <span className="text-sm text-gray-500">
                {project.contributors?.length || 0} contribuidores
              </span>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No hay proyectos disponibles. ¡Sé el primero en crear uno!
        </div>
      )}
    </div>
  );
}
