import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Bot,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  getProjectStatusVariant,
} from '../components';
import { mockProjects } from '../data/mockData';
import { ProjectStatus } from '../types';

type ViewMode = 'grid' | 'list';

export function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Projects"
        description="Manage your multi-agent AI development projects"
        actions={
          <Button icon={<Plus className="w-4 h-4" />}>New Project</Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              className="appearance-none pl-10 pr-8 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          </div>
          <div className="flex rounded-lg border border-dark-700 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid'
                  ? 'bg-dark-700 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 border-l border-dark-700 ${
                viewMode === 'list'
                  ? 'bg-dark-700 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-dark-400 mb-4">
        Showing {filteredProjects.length} of {mockProjects.length} projects
      </p>

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card hoverable className="h-full">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white">{project.name}</h3>
                    <Badge variant={getProjectStatusVariant(project.status)} dot>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-dark-400 line-clamp-2 mb-4">
                    {project.description}
                  </p>
                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-dark-700 text-dark-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-dark-400 text-xs">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-dark-700">
                    <div className="flex items-center gap-1.5 text-sm text-dark-400">
                      <Bot className="w-4 h-4" />
                      <span>{project.agentCount} agents</span>
                    </div>
                    <span className="text-xs text-dark-500">{project.lastActivity}</span>
                  </div>
                  {project.repository && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-dark-500">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{project.repository}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-dark-700">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center gap-4 p-4 hover:bg-dark-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{project.name}</h3>
                    <Badge variant={getProjectStatusVariant(project.status)} dot>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-dark-400 truncate">{project.description}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-white font-medium">{project.agentCount}</p>
                    <p className="text-dark-500 text-xs">agents</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-dark-300">{project.lastActivity}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-400">No projects found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
