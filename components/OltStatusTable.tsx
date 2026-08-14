import React, { useState, useEffect } from 'react';

interface OltInGroup {
  ip: string;
  status: 'online' | 'offline';
  latency: number | null;
}

interface OltGroup {
  groupName: string;
  olts: OltInGroup[];
}

interface OltStatusTableProps {
  title: string;
}

const OltStatusTable: React.FC<OltStatusTableProps> = ({ title }) => {
  const [groupedOlts, setGroupedOlts] = useState<OltGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchOltStatus = async () => {
      if (groupedOlts.length === 0 && !error) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetch('/api/monitoring');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        setGroupedOlts(data.groupedOlts);
        if (activeGroup === null && data.groupedOlts.length > 0) {
          setActiveGroup(data.groupedOlts[0].groupName);
        }
      } catch (err: any) {
        console.error("Failed to fetch OLT status:", err);
        setError("Failed to load OLT status. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOltStatus();
    const interval = setInterval(fetchOltStatus, 3000);

    return () => clearInterval(interval);
  }, [activeGroup, groupedOlts.length, error]);

  const getStatusClasses = (status: 'online' | 'offline') => {
    return status === 'online'
      ? 'bg-purple-600 text-white'
      : 'bg-purple-900 text-purple-300';
  };

  // الخلفية بنغمات بنفسجية داكنة
  const backgroundColorClass = 'bg-gradient-to-br from-purple-900 via-purple-950 to-purple-800';

  if (loading) {
    return (
      <div className={`${backgroundColorClass} rounded-xl p-6 shadow-lg text-center text-purple-300`}>
        Loading OLT status...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${backgroundColorClass} rounded-xl p-6 shadow-lg text-center text-red-400`}>
        {error}
      </div>
    );
  }

  const selectedGroup = groupedOlts.find(group => group.groupName === activeGroup);

  return (
    <div className={`${backgroundColorClass} rounded-xl p-4 sm:p-6 shadow-lg`}>
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-purple-200">{title}</h2>
      <p className="text-purple-400 text-xs sm:text-sm mb-4">
        Select an OLT group to view its real-time status NOT IT WORK WITH VPN SERVER.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        {groupedOlts.map((group) => (
          <button
            key={group.groupName}
            onClick={() => setActiveGroup(group.groupName)}
            className={`
              py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200
              ${
                activeGroup === group.groupName
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-purple-800 text-purple-300 hover:bg-purple-700 hover:text-white'
              }
            `}
          >
            {group.groupName}
          </button>
        ))}
      </div>

      {selectedGroup ? (
        <div className="overflow-x-auto border border-purple-700 rounded-lg">
          <table className="min-w-full divide-y divide-purple-700">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Ping (ms)
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-700">
              {selectedGroup.olts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-center text-sm text-purple-400">
                    No OLTs found in this group.
                  </td>
                </tr>
              ) : (
                selectedGroup.olts.map((olt, index) => (
                  <tr key={`${selectedGroup.groupName}-${olt.ip}-${index}`}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-purple-200">{olt.ip}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-purple-200">
                      {olt.latency !== null ? `${olt.latency} ms` : 'N/A'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(olt.status)}`}
                      >
                        {olt.status.charAt(0).toUpperCase() + olt.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center text-purple-400 border border-purple-700 rounded-lg">
          Please select an OLT group from the buttons above to view its details.
        </div>
      )}
    </div>
  );
};

export default OltStatusTable;
