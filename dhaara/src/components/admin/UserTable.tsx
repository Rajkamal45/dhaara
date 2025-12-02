'use client'

import Link from 'next/link'
import { Eye, CheckCircle, XCircle, Shield, Truck, User, Clock } from 'lucide-react'

interface UserTableProps {
  users: any[]
}

const roleConfig = {
  admin: { icon: Shield, color: 'bg-purple-100 text-purple-700' },
  logistics: { icon: Truck, color: 'bg-green-100 text-green-700' },
  user: { icon: User, color: 'bg-blue-100 text-blue-700' },
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-700' },
}

export default function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-card border rounded-lg">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No users found</p>
        <p className="text-muted-foreground">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">User</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Region</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Joined</th>
              <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const role = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user
              const status = statusConfig[user.kyc_status as keyof typeof statusConfig] || statusConfig.pending
              const RoleIcon = role.icon
              const StatusIcon = status.icon

              return (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">
                          {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.full_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        {user.business_name && (
                          <p className="text-xs text-muted-foreground truncate">{user.business_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                      <RoleIcon className="h-3 w-3" />
                      <span className="capitalize">{user.role}</span>
                      {user.admin_role && user.role === 'admin' && (
                        <span className="opacity-75">• {user.admin_role.replace('_', ' ')}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {user.region?.name || 'N/A'}
                    </span>
                    {user.region?.code && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({user.region.code})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span className="capitalize">{user.kyc_status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}