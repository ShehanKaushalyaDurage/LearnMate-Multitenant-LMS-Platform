import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../../../core/services/api.service';

interface Certificate {
  id: string;
  course?: { title: string };
  batch?: { name: string };
  student?: { firstName: string, lastName: string };
  issuedAt: string;
  uniqueCode: string;
}

@Component({
  selector: 'app-student-certificates',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">My Certificates</h1>
        <p class="page-sub">View and download your earned certifications</p>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (certs().length === 0) {
        <div class="empty-state">
          <mat-icon>workspace_premium</mat-icon>
          <p>No certificates earned yet. Complete your courses to get certified!</p>
        </div>
      } @else {
        <div class="cert-grid">
          @for (c of certs(); track c.id) {
            <div class="cert-card">
              <div class="cert-icon">
                <mat-icon>workspace_premium</mat-icon>
              </div>
              <div class="cert-content">
                <h3 class="course-name">{{ c.course?.title }}</h3>
                <p class="issued-date">Issued on {{ c.issuedAt | date:'mediumDate' }}</p>
                <div class="code-badge">CODE: {{ c.uniqueCode }}</div>
              </div>
              <div class="cert-actions">
                <button mat-flat-button color="primary" class="view-btn" (click)="preview(c)">
                  <mat-icon>visibility</mat-icon> View
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
    `,
  styles: [`
    .page { max-width: 1000px; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 0.9rem; color: #64748B; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    
    .empty-state {
        display: flex; flex-direction: column; align-items: center; gap: 12px;
        padding: 80px 40px; color: #94A3B8; text-align: center;
        background: white; border-radius: 16px; border: 1px dashed #CBD5E1;
    }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #E2E8F0; }

    .cert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .cert-card {
        background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px;
        display: flex; flex-direction: column; gap: 16px; transition: transform 0.2s, box-shadow 0.2s;
    }
    .cert-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    
    .cert-icon {
        width: 48px; height: 48px; border-radius: 12px; background: #FFFBEB; 
        color: #D97706; display: flex; align-items: center; justify-content: center;
    }
    .cert-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }

    .cert-content { flex: 1; }
    .course-name { font-size: 1.1rem; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .issued-date { font-size: 0.85rem; color: #64748B; margin: 0 0 12px; }
    .code-badge {
        display: inline-block; padding: 4px 10px; background: #F1F5F9; 
        color: #475569; border-radius: 8px; font-size: 0.75rem; font-weight: 700;
        font-family: monospace;
    }

    .view-btn { width: 100%; }
    `]
})
export class StudentCertificatesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly certs = signal<Certificate[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.api.get<{ data: { data: Certificate[] } }>('/tenant/certificates/my').subscribe({
      next: (r) => { this.certs.set(r.data.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  preview(cert: any) {
    // We reuse the look of the certificate (simplified for now or imported if possible)
    // For simplicity, I'll just open a similar dialog here.
    this.dialog.open(StudentCertificatePreviewDialog, {
      data: cert,
      width: '800px',
      maxWidth: '90vw',
    });
  }
}

// Re-implementing a similar look for the student portal preview
@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="cert-modal">
      <div class="cert-container" id="cert-print">
        <div class="cert-border">
          <div class="cert-inner">
            <div class="cert-header">
              <mat-icon class="cert-logo">workspace_premium</mat-icon>
              <h1>Certificate of Completion</h1>
            </div>
            <p class="cert-sub">This is to certify that</p>
            <h2 class="student-name">
                {{ data.student ? data.student.firstName + ' ' + data.student.lastName : 'COURSE GRADUATE' }}
            </h2>
            <p class="cert-text">has successfully completed the course</p>
            <h3 class="course-title">{{ data.course?.title }}</h3>
            <div class="cert-footer">
              <div class="sig-box">
                <div class="sig-line"></div>
                <p>Director, LearnHub</p>
              </div>
              <div class="cert-metadata">
                <p>Issued: {{ data.issuedAt | date:'longDate' }}</p>
                <p class="unique-code">Verify: {{ data.uniqueCode }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button mat-flat-button color="primary" (click)="print()">
          <mat-icon>print</mat-icon> Print / Save PDF
        </button>
      </div>
    </div>
    `,
  styles: [`
    .cert-modal { padding: 20px; background: #F8FAFC; border-radius: 8px; }
    .cert-container { 
        background: white; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        width: 100%; aspect-ratio: 1.414 / 1; overflow: hidden;
    }
    .cert-border { border: 15px double #1E40AF; padding: 10px; height: 100%; background: #fffcf5; }
    .cert-inner { 
        border: 2px solid #1E40AF; height: 100%; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; text-align: center; padding: 40px;
    }
    .cert-logo { font-size: 64px; width: 64px; height: 64px; color: #D97706; margin-bottom: 20px; }
    h1 { font-family: 'Georgia', serif; font-size: 2.5rem; color: #1E3A8A; margin-bottom: 30px; }
    .student-name { font-family: 'Brush Script MT', cursive; font-size: 3.5rem; color: #0F172A; margin: 10px 0 30px; }
    .course-title { font-size: 1.75rem; color: #1E40AF; margin: 10px 0; }
    .cert-footer { margin-top: auto; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-line { width: 180px; border-top: 1px solid #0F172A; margin-bottom: 8px; }
    .cert-metadata { text-align: right; font-size: 0.8rem; color: #64748B; }
    .unique-code { font-weight: 700; color: #1E40AF; }
    .modal-actions { margin-top: 20px; display: flex; justify-content: flex-end; }
    `]
})
class StudentCertificatePreviewDialog {
  readonly data: Certificate = inject(MAT_DIALOG_DATA);
  print() { window.print(); }
}
