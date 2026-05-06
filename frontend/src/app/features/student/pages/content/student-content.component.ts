import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContentAdminService, type ContentItem } from '../../../admin/services/content-admin.service';
import { VodPlayerComponent } from '../../components/vod-player/vod-player.component';

@Component({
    selector: 'app-student-content',
    standalone: true,
    imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, VodPlayerComponent],
    template: `
    <div class="learning-container">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <button mat-icon-button routerLink="/student/courses">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h2 class="sidebar-title">Course Content</h2>
        </div>
        
        <div class="content-list">
          @if (loading()) {
            <div class="loading-side"><mat-spinner diameter="30"></mat-spinner></div>
          } @else if (items().length === 0) {
            <p class="empty-msg">No content published yet.</p>
          } @else {
            @for (item of items(); track item.id) {
              <div class="item-row" 
                   [class.active]="selectedItem()?.id === item.id"
                   (click)="selectItem(item)">
                <div class="icon-wrap">
                  <mat-icon>{{ getIcon(item.type) }}</mat-icon>
                </div>
                <div class="item-info">
                   <div class="item-title">{{ item.title }}</div>
                   <div class="item-type">{{ item.type }}</div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Main Viewer -->
      <div class="viewer">
        @if (selectedItem(); as item) {
          <div class="viewer-header">
            <h1 class="item-main-title">{{ item.title }}</h1>
            @if (item.type !== 'VIDEO' && item.url) {
                <a [href]="item.url" target="_blank" mat-flat-button color="primary">
                   <mat-icon>open_in_new</mat-icon> Open Resource
                </a>
            }
          </div>

          <div class="viewer-body">
            @if (item.type === 'VIDEO' && item.bunnyVideoId) {
               <app-vod-player [videoId]="item.bunnyVideoId"></app-vod-player>
            } @else if (item.type === 'PDF' || item.type === 'DOCUMENT') {
               <div class="resource-preview">
                  <mat-icon>description</mat-icon>
                  <h3>{{ item.type }} Resource</h3>
                  <p>Click the button above to view or download this material.</p>
               </div>
            } @else if (item.type === 'LINK') {
                <div class="resource-preview">
                  <mat-icon>link</mat-icon>
                  <h3>External Link</h3>
                  <p>This content is hosted on an external site.</p>
               </div>
            }
          </div>
        } @else if (!loading()) {
           <div class="no-selection">
              <mat-icon>school</mat-icon>
              <h2>Welcome to the course</h2>
              <p>Select a lesson from the sidebar to begin learning.</p>
           </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .learning-container { display: flex; height: calc(100vh - 64px); background: #F8FAFC; overflow: hidden; }
    
    .sidebar { width: 350px; background: white; border-right: 1px solid #E2E8F0; display: flex; flex-direction: column; }
    .sidebar-header { padding: 16px; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; gap: 8px; }
    .sidebar-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0; }
    
    .content-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .item-row { 
        padding: 12px; border-radius: 12px; border: 1px solid transparent; 
        display: flex; align-items: center; gap: 12px; cursor: pointer;
        transition: all 0.2s;
    }
    .item-row:hover { background: #F1F5F9; }
    .item-row.active { background: #EEF2FF; border-color: #C7D2FE; }
    .item-row.active .icon-wrap { background: #6366F1; color: white; }
    
    .icon-wrap { 
        width: 36px; height: 36px; border-radius: 10px; background: #F1F5F9; 
        display: flex; align-items: center; justify-content: center; color: #64748B;
        transition: all 0.2s;
    }
    .icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    
    .item-info { flex: 1; min-width: 0; }
    .item-title { font-size: 0.875rem; font-weight: 600; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-type { font-size: 0.7rem; color: #94A3B8; font-weight: 600; text-transform: uppercase; }

    .viewer { flex: 1; display: flex; flex-direction: column; padding: 40px; overflow-y: auto; }
    .viewer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .item-main-title { font-size: 1.875rem; font-weight: 800; color: #0F172A; margin: 0; }
    
    .viewer-body { flex: 1; border-radius: 20px; }
    .resource-preview { 
        background: white; border: 1px dashed #CBD5E1; border-radius: 20px; 
        height: 100%; min-height: 400px; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; color: #64748B;
    }
    .resource-preview mat-icon { font-size: 80px; width: 80px; height: 80px; margin-bottom: 24px; opacity: 0.3; }
    
    .no-selection { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94A3B8; text-align: center; }
    .no-selection mat-icon { font-size: 100px; width: 100px; height: 100px; margin-bottom: 24px; opacity: 0.1; }

    .loading-side { display: flex; justify-content: center; padding: 40px; }
    .empty-msg { text-align: center; color: #94A3B8; padding: 40px; font-size: 0.9rem; }
  `],
})
export class StudentContentComponent implements OnInit {
    private readonly svc = inject(ContentAdminService);
    private readonly route = inject(ActivatedRoute);

    readonly items = signal<ContentItem[]>([]);
    readonly selectedItem = signal<ContentItem | null>(null);
    readonly loading = signal(true);

    ngOnInit() {
        const courseId = this.route.snapshot.paramMap.get('id');
        if (courseId) this.load(courseId);
    }

    load(courseId: string) {
        this.svc.getContent(courseId, 1, 100).subscribe({
            next: (res) => {
                const visible = res.data.filter(i => i.isVisible);
                this.items.set(visible);
                if (visible.length > 0) this.selectedItem.set(visible[0]);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    selectItem(item: ContentItem) {
        this.selectedItem.set(item);
    }

    getIcon(type: string): string {
        switch (type) {
            case 'VIDEO': return 'play_circle';
            case 'PDF': return 'picture_as_pdf';
            case 'DOCUMENT': return 'description';
            case 'LINK': return 'link';
            default: return 'article';
        }
    }
}
