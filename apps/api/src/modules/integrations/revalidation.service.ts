import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Сообщает публичному сайту (Next), что кэш каталога устарел. */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: ConfigService) {}

  /** Fire-and-forget: недоступность сайта не должна ломать сохранение в админке. */
  revalidate(tags: string[]) {
    const url = this.config.get<string>('WEB_REVALIDATE_URL');
    if (!url) return;

    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': this.config.get('REVALIDATE_SECRET', ''),
      },
      body: JSON.stringify({ tags }),
    }).catch((err) => this.logger.warn(`revalidate failed: ${String(err)}`));
  }
}
