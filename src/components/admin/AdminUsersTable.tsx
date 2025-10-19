// File: src/components/admin/AdminUsersTable.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface UserRow {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string;
}

const AdminUsersTable: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      const payload = res.data?.users ?? res.data ?? [];
      setUsers(
        (payload as any[]).map((u) => ({ id: u._id ?? u.id, email: u.email, name: u.name ?? u.display_name, role: u.role ?? 'user', createdAt: u.created_at ?? u.createdAt }))
      );
    } catch (err: any) {
      console.error('fetchUsers error', err);
      toast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast({ title: 'Success', description: 'User role updated' });
      fetchUsers();
    } catch (err: any) {
      console.error('changeRole error', err);
      toast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to update role', variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast({ title: 'Deleted', description: 'User removed' });
      fetchUsers();
    } catch (err: any) {
      console.error('deleteUser error', err);
      toast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to delete user', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Joined</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-3">{u.name ?? '—'}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.role}</td>
                  <td className="py-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => changeRole(u.id, u.role === 'admin' ? 'user' : 'admin')}>{u.role === 'admin' ? 'Demote' : 'Promote'}</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUsersTable;