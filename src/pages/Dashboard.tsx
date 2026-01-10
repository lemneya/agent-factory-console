import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Activity,
  Bell,
  Bot,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { PageHeader, Card, CardContent, Badge, getRunStatusVariant, ProgressBar } from '../components';
import { mockProjects, mockRuns, mockNotifications } from '../data/mockData';

const stats = [
  {
    label: 'Active Projects',
    value: mockProjects.filter((p) => p.status === 'active').length,
    total: mockProjects.length,
    icon: FolderKanban,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10',
  },
  {
    label: 'Running Tasks',
    value: mockRuns.filter((r) => r.status === 'running').length,
    total: mockRuns.length,
    icon: Activity,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    label: 'Total Agents',
    value: mockProjects.reduce((acc, p) => acc + p.agentCount, 0),
    icon: Bot,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  {
    label: 'Unread Alerts',
    value: mockNotifications.filter((n) => !n.read).length,
    icon: Bell,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
];

export function Dashboard() {
  const activeRuns = mockRuns.filter((r) => r.status === 'running' || r.status === 'pending');
  const recentNotifications = mockNotifications.slice(0, 4);

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your multi-agent AI development environment"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-dark-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white">
                  {stat.value}
                  {stat.total && (
                    <span className="text-sm font-normal text-dark-500"> / {stat.total}</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Runs */}
        <Card>
          <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">Active Runs</h2>
            </div>
            <Link
              to="/runs"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <CardContent className="space-y-4">
            {activeRuns.length === 0 ? (
              <p className="text-dark-400 text-center py-4">No active runs</p>
            ) : (
              activeRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-dark-800/50 border border-dark-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white truncate">{run.agentName}</span>
                      <Badge
                        variant={getRunStatusVariant(run.status)}
                        dot
                        pulse={run.status === 'running'}
                      >
                        {run.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-dark-400 truncate">{run.projectName}</p>
                    <ProgressBar
                      value={run.completedTasks}
                      max={run.taskCount}
                      className="mt-2"
                      size="sm"
                    />
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-dark-300">
                      {run.completedTasks}/{run.taskCount}
                    </p>
                    <p className="text-dark-500">tasks</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">Recent Notifications</h2>
            </div>
            <Link
              to="/notifications"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <CardContent className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-3 p-3 rounded-lg border ${
                  notification.read
                    ? 'bg-dark-800/30 border-dark-700/50'
                    : 'bg-dark-800/50 border-dark-600'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {notification.type === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  {notification.type === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  {notification.type === 'warning' && (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  )}
                  {notification.type === 'info' && (
                    <TrendingUp className="w-5 h-5 text-primary-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${notification.read ? 'text-dark-300' : 'text-white'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-dark-500 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      <Card className="mt-6">
        <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Projects Overview</h2>
          </div>
          <Link
            to="/projects"
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockProjects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="p-4 rounded-lg bg-dark-800/50 border border-dark-700 hover:border-dark-600 hover:bg-dark-800 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors truncate">
                    {project.name}
                  </h3>
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                      project.status === 'active'
                        ? 'bg-emerald-400'
                        : project.status === 'paused'
                        ? 'bg-amber-400'
                        : project.status === 'error'
                        ? 'bg-red-400'
                        : 'bg-primary-400'
                    }`}
                  />
                </div>
                <p className="text-sm text-dark-400 line-clamp-2 mb-3">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-dark-500">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    {project.agentCount} agents
                  </span>
                  <span>{project.lastActivity}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
