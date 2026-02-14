import { Injectable, NestMiddleware } from '@nestjs/common';
import { createNamespace, getNamespace } from 'cls-hooked';
import { NextFunction, Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';

export const CORRELATION_NAMESPACE = 'correlation-context';
export const CORRELATION_ID_KEY = 'correlationId';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip metrics endpoint
    if (req.url === '/metrics') {
      return next();
    }

    let namespace = getNamespace(CORRELATION_NAMESPACE);
    namespace ??= createNamespace(CORRELATION_NAMESPACE);

    namespace.run(() => {
      const correlationId =
        (req.headers['x-correlation-id'] as string) ||
        (req.headers['x-request-id'] as string) ||
        uuidv7();

      namespace.set(CORRELATION_ID_KEY, correlationId);
      (req as any).correlationId = correlationId;
      res.setHeader('X-Correlation-ID', correlationId);

      next();
    });
  }
}

export function getCorrelationId(): string {
  const namespace = getNamespace(CORRELATION_NAMESPACE);
  return namespace?.get(CORRELATION_ID_KEY) || 'no-correlation-id';
}
