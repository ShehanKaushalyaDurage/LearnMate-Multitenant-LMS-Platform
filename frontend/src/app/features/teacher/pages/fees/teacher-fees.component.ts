import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../../core/services/api.service';

interface Invoice {
    id: string;
    studentId: string;
    amountLkr: number;
    dueDate: string;
    status: string;
    paidAt?: string;
    student: { id: string; firstName: string; lastName: string; email: string };
    batch: { id: string; name: string };
}

@Component({
    selector: 'app-teacher-fees',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Student Payments</h1>
        <p class="page-sub">Payment statuses for students in your classes</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Student</th><th>Email</th><th>Batch</th><th>Amount (LKR)</th><th>Due Date</th><th>Status</th><th>Paid At</th>
            </tr></thead>
            <tbody>
              @for (inv of invoices(); track inv.id) {
                <tr>
                  <td class="name-cell">{{ inv.student.firstName }} {{ inv.student.lastName }}</td>
                  <td>{{ inv.student.email }}</td>
                  <td>{{ inv.batch.name }}</td>
                  <td>{{ inv.amountLkr | number }}</td>
                  <td>{{ inv.dueDate | date:'mediumDate' }}</td>
                  <td>
                    <span class="status-chip" [class]="'status-' + inv.status">{{ inv.status }}</span>
                  </td>
                  <td>{{ inv.paidAt ? (inv.paidAt | date:'medium') : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (invoices().length === 0) {
          <div class="empty">
            <mat-icon>payments</mat-icon>
            <p>No payment records found for your classes</p>
          </div>
        }
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1200px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: #94A3B8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #E2E8F0; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
    .data-table td { padding: 12px 16px; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #F1F5F9; }
    .name-cell { font-weight: 600; color: #0F172A; }

    .status-chip { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }
    .status-PAID { background: #ECFDF5; color: #059669; }
    .status-PENDING { background: #FEF3C7; color: #D97706; }
    .status-OVERDUE { background: #FEF2F2; color: #DC2626; }
  `],
})
export class TeacherFeesComponent implements OnInit {
    private readonly api = inject(ApiService);

    readonly invoices = signal<Invoice[]>([]);
    readonly loading = signal(true);

    ngOnInit() {
        this.api.get<any>('/tenant/fees/teacher-invoices').subscribe({
            next: (r) => { this.invoices.set(r.data ?? []); this.loading.set(false); },
            error: () => this.loading.set(false),
        });
    }
}
