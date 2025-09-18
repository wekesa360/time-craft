import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  Mail,
  Calendar,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  joinedDate: string;
  subscription: 'free' | 'premium' | 'student';
  isVerified: boolean;
}

// Mock data - in real app this would come from API
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'user',
    status: 'active',
    lastActive: '2 hours ago',
    joinedDate: '2024-01-15',
    subscription: 'premium',
    isVerified: true
  },
  {
    id: '2',
    email: 'jane.smith@university.edu',
    name: 'Jane Smith',
    role: 'user',
    status: 'active',
    lastActive: '1 day ago',
    joinedDate: '2024-02-20',
    subscription: 'student',
    isVerified: true
  },
  {
    id: '3',
    email: 'admin@timecraft.app',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    lastActive: '5 minutes ago',
    joinedDate: '2023-12-01',
    subscription: 'premium',
    isVerified: true
  },
  {
    id: '4',
    email: 'inactive.user@example.com',
    name: 'Inactive User',
    role: 'user',
    status: 'inactive',
    lastActive: '30 days ago',
    joinedDate: '2024-01-10',
    subscription: 'free',
    isVerified: false
  },
  {
    id: '5',
    email: 'moderator@timecraft.app',
    name: 'Mod User',
    role: 'moderator',
    status: 'active',
    lastActive: '1 hour ago',
    joinedDate: '2024-01-05',
    subscription: 'premium',
    isVerified: true
  }
];

interface UserManagementProps {
  className?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-red-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'suspended': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSubscriptionBadge = (subscription: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (subscription) {
      case 'premium':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>Premium</span>;
      case 'student':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>Student</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`}>Free</span>;
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(t('admin.users.confirmDelete', 'Are you sure you want to delete this user?'))) {
      // In real app, this would call an API
      console.log('Deleting user:', user.id);
    }
  };

  const handleSuspendUser = (user: User) => {
    // In real app, this would call an API
    console.log('Suspending user:', user.id);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('admin.users.title', 'User Management')}
          </h2>
          <p className="text-foreground-secondary mt-1">
            {t('admin.users.subtitle', 'Manage user accounts and permissions')}
          </p>
        </div>
        
        <button className="btn-primary flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>{t('admin.users.addUser', 'Add User')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.users.searchPlaceholder', 'Search users...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input"
            >
              <option value="all">{t('admin.users.allRoles', 'All Roles')}</option>
              <option value="user">{t('admin.users.role.user', 'User')}</option>
              <option value="moderator">{t('admin.users.role.moderator', 'Moderator')}</option>
              <option value="admin">{t('admin.users.role.admin', 'Admin')}</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="all">{t('admin.users.allStatuses', 'All Statuses')}</option>
              <option value="active">{t('admin.users.status.active', 'Active')}</option>
              <option value="inactive">{t('admin.users.status.inactive', 'Inactive')}</option>
              <option value="suspended">{t('admin.users.status.suspended', 'Suspended')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  {t('admin.users.table.user', 'User')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  {t('admin.users.table.role', 'Role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  {t('admin.users.table.status', 'Status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  {t('admin.users.table.subscription', 'Subscription')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  {t('admin.users.table.lastActive', 'Last Active')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  {t('admin.users.table.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-background-secondary transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground flex items-center">
                          {user.name}
                          {user.isVerified && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                          )}
                        </div>
                        <div className="text-sm text-foreground-secondary flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-2 text-sm text-foreground capitalize">
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.status)}
                      <span className="ml-2 text-sm text-foreground capitalize">
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSubscriptionBadge(user.subscription)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-secondary">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {user.lastActive}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title={t('admin.users.edit', 'Edit user')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleSuspendUser(user)}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title={t('admin.users.suspend', 'Suspend user')}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title={t('admin.users.delete', 'Delete user')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('admin.users.noUsers', 'No users found')}
            </h3>
            <p className="text-foreground-secondary">
              {t('admin.users.noUsersDescription', 'Try adjusting your search or filter criteria.')}
            </p>
          </div>
        )}
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {users.length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.users.stats.total', 'Total Users')}
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.users.stats.active', 'Active Users')}
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">
            {users.filter(u => u.subscription === 'premium').length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.users.stats.premium', 'Premium Users')}
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">
            {users.filter(u => u.subscription === 'student').length}
          </div>
          <div className="text-sm text-foreground-secondary">
            {t('admin.users.stats.student', 'Student Users')}
          </div>
        </div>
      </div>

      {/* User Modal (placeholder) */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('admin.users.editUser', 'Edit User')}
            </h3>
            <p className="text-foreground-secondary mb-4">
              {t('admin.users.editUserDescription', 'User editing functionality would be implemented here.')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-secondary"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-primary"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;