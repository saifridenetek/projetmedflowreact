import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private subject = new Subject<any>();

  emit(event: any) {
    try {
      this.subject.next(event);
    } catch (err) {
      // swallow errors to avoid crashing services
      console.warn('Failed to emit notification', err?.message || err);
    }
  }

  getStream(): Observable<any> {
    return this.subject.asObservable();
  }

  onModuleDestroy() {
    this.subject.complete();
  }
}
