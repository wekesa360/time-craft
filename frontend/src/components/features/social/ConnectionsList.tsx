import React, { useState } from 'react';
import type { Connection } from '../../../types';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search, 
  MessageCircle,
  Trophy,
  Calendar,
  MoreHorizontal,
  Check,
  X
} from 'lucide-react';

interface ConnectionsListProps {
  connections: Connection[];
  pendingRequests: Connection[];
  onSendRequest: (email: string, message?: string) => void;
  onAcceptRequest: (connectionId: string) => void;
  onDeclineRequest: (connectionId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
  isLoading?: boolean;
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({
  connections,
  pendingRequests,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveConnection,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'add'>('connections');
  const [searchTerm, setSearchTerm] = useState('');
  const [newConnectionEmail, setNewConnectionEmail] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');

  const filteredConnections = connections.filter(connection =>
    `${connection.firstName} ${connection.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newConnectionEmail.trim()) {
      onSendRequest(newConnectionEmail.trim(), connectionMessage.trim() || undefined);
      setNewConnectionEmail('');
      setConnectionMessage('');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-background-secondary rounded-lg">
              <div className="w-12 h-12 bg-background-tertiary rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-background-tertiary rounded w-1/3"></div>
                <div className="h-3 bg-background-tertiary rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">Connections</h2>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center bg-background-secondary rounded-lg p-1">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'connections'
                ? 'bg-primary-600 text-white'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'bg-primary-600 text-white'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Pending ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-primary-600 text-white'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            Add New
          </button>
        </div>
      </div>

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Connections List */}
          <div className="card p-6">
            {filteredConnections.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {connections.length === 0 ? 'No connections yet' : 'No connections found'}
                </h3>
                <p className="text-foreground-secondary mb-4">
                  {connections.length === 0 
                    ? 'Connect with friends and colleagues to share your productivity journey'
                    : 'Try adjusting your search terms'
                  }
                </p>
                {connections.length === 0 && (
                  <button 
                    onClick={() => setActiveTab('add')}
                    className="btn btn-primary"
                  >
                    Add Your First Connection
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConnections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-4 bg-background-secondary rounded-lg hover:bg-background-tertiary transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {connection.firstName.charAt(0)}{connection.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {connection.firstName} {connection.lastName}
                        </h4>
                        <p className="text-sm text-foreground-secondary">
                          Connected {connection.connectedAt ? formatDate(connection.connectedAt) : 'recently'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="btn-ghost p-2" title="Send message">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button className="btn-ghost p-2" title="View profile">
                        <Trophy className="w-4 h-4" />
                      </button>
                      <button className="btn-ghost p-2" title="More options">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="card p-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">No pending requests</h3>
              <p className="text-foreground-secondary">
                Connection requests will appear here when you receive them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground mb-4">
                Pending Connection Requests ({pendingRequests.length})
              </h3>
              
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {request.firstName.charAt(0)}{request.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {request.firstName} {request.lastName}
                      </h4>
                      <p className="text-sm text-foreground-secondary">
                        Wants to connect with you
                      </p>
                      {request.message && (
                        <p className="text-sm text-foreground-secondary mt-1 italic">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onAcceptRequest(request.id)}
                      className="btn btn-primary px-3 py-1 text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDeclineRequest(request.id)}
                      className="btn btn-secondary text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add New Connection Tab */}
      {activeTab === 'add' && (
        <div className="card p-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <UserPlus className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Add New Connection</h3>
              <p className="text-foreground-secondary">
                Send a connection request to someone you'd like to connect with
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newConnectionEmail}
                  onChange={(e) => setNewConnectionEmail(e.target.value)}
                  className="input w-full"
                  placeholder="Enter their email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={connectionMessage}
                  onChange={(e) => setConnectionMessage(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="Add a personal message to your connection request..."
                />
                <p className="text-xs text-foreground-secondary mt-1">
                  A friendly message increases the chance they'll accept your request
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={!newConnectionEmail.trim()}
              >
                Send Connection Request
              </button>
            </form>

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Connection Tips
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Connect with friends, family, and colleagues</li>
                <li>• Add a personal message to increase acceptance</li>
                <li>• Share your productivity journey together</li>
                <li>• Participate in challenges and compete friendly</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsList;