export default function System() {
  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">System Settings</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-6">System Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Database Status</span>
              <span className="text-sm text-green-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Healthy
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">API Response Time</span>
              <span className="text-sm text-green-600">42ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Storage Usage</span>
              <span className="text-sm text-green-600">34% (12.4 GB)</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-6">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">System Name</label>
              <input
                type="text"
                value="Clarity Platform"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Backup Frequency</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option>Every 2 hours</option>
                <option>Every 4 hours</option>
                <option>Daily</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
