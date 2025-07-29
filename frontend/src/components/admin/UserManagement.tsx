import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  lastActive: string
  dateCreated: string
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'admin@fbot.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      status: 'active',
      lastActive: '2024-01-16',
      dateCreated: '2024-01-01',
    },
    {
      id: '2',
      email: 'test@hashagency.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      status: 'active',
      lastActive: '2024-01-16',
      dateCreated: '2024-01-10',
    },
    {
      id: '3',
      email: 'dr.smith@medical.com',
      firstName: 'Dr. Sarah',
      lastName: 'Smith',
      role: 'user',
      status: 'active',
      lastActive: '2024-01-15',
      dateCreated: '2024-01-12',
    },
    {
      id: '4',
      email: 'inactive@example.com',
      firstName: 'Inactive',
      lastName: 'User',
      role: 'user',
      status: 'inactive',
      lastActive: '2024-01-01',
      dateCreated: '2024-01-05',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'admin' | 'user',
    password: '',
  })

  const handleAddUser = () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password) {
      toast.error('Please fill in all required fields')
      return
    }

    const user: User = {
      id: Date.now().toString(),
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      status: 'active',
      lastActive: 'Never',
      dateCreated: new Date().toISOString().split('T')[0],
    }

    setUsers([...users, user])
    setShowAddModal(false)
    setNewUser({ email: '', firstName: '', lastName: '', role: 'user', password: '' })
    toast.success('User created successfully')
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: '',
    })
    setShowAddModal(true)
  }

  const handleUpdateUser = () => {
    if (!editingUser) return

    const updatedUsers = users.map((user) =>
      user.id === editingUser.id
        ? {
            ...user,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
          }
        : user
    )

    setUsers(updatedUsers)
    setShowAddModal(false)
    setEditingUser(null)
    setNewUser({ email: '', firstName: '', lastName: '', role: 'user', password: '' })
    toast.success('User updated successfully')
  }

  const handleDeleteUser = (userId: string) => {
    if (userId === '1') {
      toast.error('Cannot delete system administrator')
      return
    }

    setUsers(users.filter((user) => user.id !== userId))
    toast.success('User deleted successfully')
  }

  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = users.map((user) =>
      user.id === userId
        ? { ...user, status: user.status === 'active' ? 'inactive' as const : 'active' as const }
        : user
    )
    setUsers(updatedUsers)
    toast.success('User status updated')
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <ShieldCheckIcon className="h-4 w-4 text-red-500" />
      case 'user':
        return <UserIcon className="h-4 w-4 text-blue-500" />
    }
  }

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            Admin
          </span>
        )
      case 'user':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserIcon className="h-3 w-3 mr-1" />
            User
          </span>
        )
    }
  }

  const getStatusBadge = (status: User['status']) => {
    return status === 'active' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    admins: users.filter((u) => u.role === 'admin').length,
    users: users.filter((u) => u.role === 'user').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Active Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          <div className="text-sm text-gray-500">Administrators</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
          <div className="text-sm text-gray-500">Regular Users</div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-medical-500 focus:ring-medical-500"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setEditingUser(null)
            setNewUser({ email: '', firstName: '', lastName: '', role: 'user', password: '' })
            setShowAddModal(true)
          }}
          className="flex items-center space-x-2 bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700 transition-colors"
        >
          <UserPlusIcon className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({filteredUsers.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-medical-100 flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-gray-600 hover:text-medical-600 p-1 rounded"
                        title="Edit user"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={`p-1 rounded ${
                          user.status === 'active'
                            ? 'text-gray-600 hover:text-yellow-600'
                            : 'text-gray-600 hover:text-green-600'
                        }`}
                        title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.status === 'active' ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                      {user.id !== '1' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-gray-600 hover:text-red-600 p-1 rounded"
                          title="Delete user"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-600 bg-opacity-75"
                onClick={() => setShowAddModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-medical-500 focus:ring-medical-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-medical-500 focus:ring-medical-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-medical-500 focus:ring-medical-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-medical-500 focus:ring-medical-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-medical-500 focus:ring-medical-500"
                      />
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingUser ? handleUpdateUser : handleAddUser}
                    className="px-4 py-2 bg-medical-600 text-white rounded-lg text-sm font-medium hover:bg-medical-700"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserManagement 