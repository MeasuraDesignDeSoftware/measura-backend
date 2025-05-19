import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

interface RequestData {
  count: number;
  firstRequest: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requestMap = new Map<string, RequestData>();
  private readonly REQUEST_LIMIT = 5;
  private readonly TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || 'unknown';

    const now = Date.now();
    const key = `${ip}:${request.path}`;

    if (!this.requestMap.has(key)) {
      this.requestMap.set(key, { count: 1, firstRequest: now });
      return true;
    }

    const requestData = this.requestMap.get(key);

    if (!requestData) {
      this.requestMap.set(key, { count: 1, firstRequest: now });
      return true;
    }

    if (now - requestData.firstRequest > this.TIME_WINDOW) {
      this.requestMap.set(key, { count: 1, firstRequest: now });
      return true;
    }

    requestData.count++;

    if (requestData.count > this.REQUEST_LIMIT) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  constructor() {
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, data] of this.requestMap.entries()) {
          if (now - data.firstRequest > this.TIME_WINDOW) {
            this.requestMap.delete(key);
          }
        }
      },
      10 * 60 * 1000,
    );
  }
}
