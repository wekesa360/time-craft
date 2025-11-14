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
            <div key={i} className="flex items-center space-x-4 p-4 bg-muted rounded-xl">
              <div className="w-12 h-12 bg-muted/50 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/50 rounded w-1/3"></div>
                <div className="h-3 bg-muted/50 rounded w-1/4"></div>
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
        <div className="flex items-center bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'connections'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Connections List */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            {filteredConnections.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {connections.length === 0 ? 'No connections yet' : 'No connections found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {connections.length === 0 
                    ? 'Connect with friends and colleagues to share your productivity journey'
                    : 'Try adjusting your search terms'
                  }
                </p>
                {connections.length === 0 && (
                  <button 
                    onClick={() => setActiveTab('add')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    Add Your First Connection
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConnections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-border hover:border-primary transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {connection.firstName.charAt(0)}{connection.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {connection.firstName} {connection.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Connected {connection.connectedAt ? formatDate(connection.connectedAt) : 'recently'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Send message">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="View profile">
                        <Trophy className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="More options">
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
        <div className="bg-card rounded-2xl p-6 border border-border">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                Connection requests will appear here when you receive them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground mb-4">
                Pending Connection Requests ({pendingRequests.length})
              </h3>
              
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-border">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {request.firstName.charAt(0)}{request.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {request.firstName} {request.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Wants to connect with you
                      </p>
                      {request.message && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onAcceptRequest(request.id)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDeclineRequest(request.id)}
                      className="px-4 py-2 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors text-sm"
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
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Add New Connection</h3>
              <p className="text-muted-foreground">
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
                  className="w-full px-4 py-2 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-20 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A friendly message increases the chance they'll accept your request
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newConnectionEmail.trim()}
              >
                Send Connection Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsList;