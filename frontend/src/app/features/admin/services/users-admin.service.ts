import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface UserRow {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    phone?: string;
    createdAt: string;
}

export interface InviteUserDto {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone?: string;
    password: string;
}

@Injectable({ providedIn: 'root' })
export class UsersAdminService {
    private readonly api = inject(ApiService);

    getUsers(page = 1, limit = 20, role?: string, search?: string) {
        const params: Record<string, any> = { page, limit };
        if (role) params['role'] = role;
        if (search) params['search'] = search;
        return this.api.get<{ data: { data: UserRow[]; meta: any } }>('/tenant/users', params);
    }

    inviteUser(dto: InviteUserDto) {
        return this.api.post<{ data: UserRow }>('/tenant/users', dto);
    }

    updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') {
        return this.api.patch<{ data: UserRow }>(`/tenant/users/${id}/status`, { status });
    }
}
