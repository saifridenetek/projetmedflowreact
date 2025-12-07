import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // Server-Sent Events endpoint
  @Sse('stream')
  stream(): Observable<any> {
    // emit plain objects as SSE data; the client will parse JSON if needed
    return this.notificationsService.getStream().pipe(
      map((payload) => ({ data: JSON.stringify(payload) }))
    );
  }
}
