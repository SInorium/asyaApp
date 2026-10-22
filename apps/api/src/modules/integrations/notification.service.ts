import { Injectable, Logger } from '@nestjs/common';

export interface NewInquiryNotice {
  authorUserId: string;
  artworkTitle: string;
  customerName: string;
  customerEmail: string;
}

/**
 * Пока пишет в лог. Позже здесь появится отправка email или в Telegram —
 * вызывающий код (InquiriesService) при этом не изменится.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async newInquiry(notice: NewInquiryNotice) {
    this.logger.log(
      `Новая заявка на «${notice.artworkTitle}» от ${notice.customerName} <${notice.customerEmail}>`,
    );
  }
}
