/**
 * Support Tickets Component
 * Support ticket management interface
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';
import { FadeIn, Stagger } from '../../ui/animations';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'feature' | 'support' | 'billing' | 'account';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  tags: string[];
  responses: number;
}

interface SupportTicketsProps {
  className?: string;
}

const SupportTickets: React.FC<SupportTicketsProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Mock data - in real app, this would come from API
  const tickets: SupportTicket[] = [
    {
      id: '1',
      subject: 'Unable to sync tasks with calendar',
      description: 'When I try to sync my tasks with Google Calendar, I get an error message saying "Authentication failed". I have tried reconnecting my account multiple times but the issue persists.',
      status: 'open',
      priority: 'high',
      category: 'bug',
      createdAt: '2024-02-10T10:30:00Z',
      updatedAt: '2024-02-10T10:30:00Z',
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      tags: ['calendar', 'sync', 'authentication'],
      responses: 0,
    },
    {
      id: '2',
      subject: 'Feature request: Dark mode for mobile app',
      description: 'It would be great to have a dark mode option in the mobile app. The current light theme is too bright when using the app at night.',
      status: 'in_progress',
      priority: 'medium',
      category: 'feature',
      createdAt: '2024-02-09T14:15:00Z',
      updatedAt: '2024-02-10T09:20:00Z',
      user: {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      assignedTo: {
        id: 'admin1',
        name: 'Support Agent',
        email: 'support@example.com',
      },
      tags: ['mobile', 'ui', 'enhancement'],
      responses: 2,
    },
    {
      id: '3',
      subject: 'Billing issue - charged twice',
      description: 'I was charged twice for my premium subscription this month. Please refund the duplicate charge.',
      status: 'resolved',
      priority: 'critical',
      category: 'billing',
      createdAt: '2024-02-08T16:45:00Z',
      updatedAt: '2024-02-09T11:30:00Z',
      user: {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
      },
      assignedTo: {
        id: 'admin2',
        name: 'Billing Support',
        email: 'billing@example.com',
      },
      tags: ['billing', 'refund', 'premium'],
      responses: 4,
    },
    {
      id: '4',
      subject: 'Account locked after password reset',
      description: 'My account got locked after I tried to reset my password. I cannot log in anymore.',
      status: 'open',
      priority: 'high',
      category: 'account',
      createdAt: '2024-02-10T08:20:00Z',
      updatedAt: '2024-02-10T08:20:00Z',
      user: {
        id: '4',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
      },
      tags: ['account', 'password', 'locked'],
      responses: 0,
    },
  ];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-error-light text-error dark:bg-error/20 dark:text-error-light';
      case 'in_progress':
        return 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light';
      case 'resolved':
        return 'bg-success-light text-success dark:bg-success/20 dark:text-success-light';
      case 'closed':
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-error-light text-error dark:bg-error/20 dark:text-error-light';
      case 'high':
        return 'bg-primary-100 text-primary dark:bg-primary/20 dark:text-primary-300';
      case 'medium':
        return 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light';
      case 'low':
        return 'bg-success-light text-success dark:bg-success/20 dark:text-success-light';
      default:
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: SupportTicket['category']) => {
    switch (category) {
      case 'bug':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'feature':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'billing':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'account':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
    }
  };

  const updateTicketStatus = (ticketId: string, newStatus: SupportTicket['status']) => {
    // TODO: Implement API call to update ticket status
    console.log(`Update ticket ${ticketId} to status: ${newStatus}`);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white">
              Support Tickets
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Manage customer support requests and issues
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">
              {tickets.filter(t => t.status === 'open').length} open tickets
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Tickets List */}
      <Stagger stagger={0.1} direction="up">
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTicket(ticket);
                setShowTicketModal(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(ticket.category)}
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground uppercase">
                        #{ticket.id}
                      </span>
                    </div>
                    
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(ticket.status)
                    )}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getPriorityColor(ticket.priority)
                    )}>
                      {ticket.priority}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                    {ticket.subject}
                  </h3>
                  
                  <p className="text-muted-foreground dark:text-muted-foreground mb-3 line-clamp-2">
                    {ticket.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground dark:text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                            {ticket.user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span>{ticket.user.name}</span>
                      </div>
                      
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      
                      {ticket.responses > 0 && (
                        <>
                          <span>•</span>
                          <span>{ticket.responses} responses</span>
                        </>
                      )}
                    </div>
                    
                    {ticket.assignedTo && (
                      <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Assigned to: {ticket.assignedTo.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {ticket.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ticket.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="ml-6 flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTicketStatus(ticket.id, 'in_progress');
                      }}
                      size="sm"
                      variant="outline"
                      disabled={ticket.status === 'in_progress'}
                    >
                      Assign
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTicketStatus(ticket.id, 'resolved');
                      }}
                      size="sm"
                      className="bg-success hover:bg-success text-white"
                      disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Stagger>

      {/* Empty State */}
      {filteredTickets.length === 0 && (
        <FadeIn>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
              No tickets found
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        </FadeIn>
      )}

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {showTicketModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white">
                    Ticket #{selectedTicket.id}
                  </h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    {selectedTicket.subject}
                  </p>
                </div>
                
                <Button
                  onClick={() => {
                    setShowTicketModal(false);
                    setSelectedTicket(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(selectedTicket.status)
                  )}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getPriorityColor(selectedTicket.priority)
                  )}>
                    {selectedTicket.priority}
                  </span>
                  
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {selectedTicket.category}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                    Description
                  </h4>
                  <p className="text-muted-foreground dark:text-muted-foreground bg-muted dark:bg-muted p-3 rounded-lg">
                    {selectedTicket.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                      Customer
                    </h4>
                    <div className="text-sm">
                      <div className="font-medium text-foreground dark:text-white">
                        {selectedTicket.user.name}
                      </div>
                      <div className="text-muted-foreground dark:text-muted-foreground">
                        {selectedTicket.user.email}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                      Assigned To
                    </h4>
                    <div className="text-sm">
                      {selectedTicket.assignedTo ? (
                        <>
                          <div className="font-medium text-foreground dark:text-white">
                            {selectedTicket.assignedTo.name}
                          </div>
                          <div className="text-muted-foreground dark:text-muted-foreground">
                            {selectedTicket.assignedTo.email}
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground dark:text-muted-foreground">
                          Unassigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                    Timeline
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</div>
                    <div>Updated: {new Date(selectedTicket.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <Button
                  onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                  variant="outline"
                  disabled={selectedTicket.status === 'in_progress'}
                >
                  Assign to Me
                </Button>
                <Button
                  onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                  className="bg-success hover:bg-success text-white"
                  disabled={selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'}
                >
                  Mark Resolved
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTickets;