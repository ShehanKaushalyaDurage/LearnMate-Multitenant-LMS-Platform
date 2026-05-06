import { Component, Input, inject, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-vod-player',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="player-container">
      @if (videoUrl) {
        <iframe
          [src]="videoUrl"
          loading="lazy"
          style="border:0;position:absolute;top:0;height:100%;width:100%;"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowfullscreen="true">
        </iframe>
      } @else {
        <div class="player-placeholder">
          <div class="spinner"></div>
          <p>Preparing video...</p>
        </div>
      }
    </div>
  `,
    styles: [`
    .player-container {
      position: relative;
      padding-top: 56.25%; /* 16:9 Aspect Ratio */
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .player-placeholder {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #94A3B8;
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #1E293B; border-top-color: #6366F1;
      border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class VodPlayerComponent implements OnChanges {
    @Input({ required: true }) videoId!: string;
    @Input() libraryId: string = '375604'; // Default library ID if available, otherwise should be configurable

    videoUrl?: SafeResourceUrl;
    private readonly sanitizer = inject(DomSanitizer);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['videoId'] && this.videoId) {
            const url = `https://iframe.mediadelivery.net/embed/${this.libraryId}/${this.videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
            this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        }
    }
}
