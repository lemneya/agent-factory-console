import { useState } from 'react';
import {
  Bell,
  Shield,
  Database,
  Key,
  Save,
} from 'lucide-react';
import { PageHeader, Card, CardHeader, CardContent, Button } from '../components';

export function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      runCompletions: true,
      runFailures: true,
      systemUpdates: false,
    },
    general: {
      darkMode: true,
      autoRefresh: true,
      refreshInterval: 30,
    },
  });

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Settings"
        description="Configure your Agent Factory Console preferences"
      />

      <div className="max-w-3xl space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Email Alerts</p>
                <p className="text-sm text-dark-400">Receive email notifications for important events</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.emailAlerts}
                onChange={() => handleNotificationChange('emailAlerts')}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Run Completions</p>
                <p className="text-sm text-dark-400">Get notified when agent runs complete successfully</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.runCompletions}
                onChange={() => handleNotificationChange('runCompletions')}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Run Failures</p>
                <p className="text-sm text-dark-400">Get notified when agent runs fail or encounter errors</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.runFailures}
                onChange={() => handleNotificationChange('runFailures')}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">System Updates</p>
                <p className="text-sm text-dark-400">Receive notifications about system maintenance and updates</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.systemUpdates}
                onChange={() => handleNotificationChange('systemUpdates')}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
              />
            </label>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">API Configuration</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                API Endpoint
              </label>
              <input
                type="text"
                defaultValue="https://api.agentfactory.io/v1"
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                defaultValue="sk-xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">Security</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-dark-400">Add an extra layer of security to your account</p>
              </div>
              <Button variant="secondary" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Active Sessions</p>
                <p className="text-sm text-dark-400">Manage your active login sessions</p>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">Data Management</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Export Data</p>
                <p className="text-sm text-dark-400">Download all your project and run data</p>
              </div>
              <Button variant="secondary" size="sm">Export</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Clear Run History</p>
                <p className="text-sm text-dark-400">Remove all completed run logs older than 30 days</p>
              </div>
              <Button variant="danger" size="sm">Clear</Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button icon={<Save className="w-4 h-4" />}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
