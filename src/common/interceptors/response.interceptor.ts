import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { data: T }> {
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<{ data: T }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return next.handle().pipe(map((data) => ({ data })));
  }
}
