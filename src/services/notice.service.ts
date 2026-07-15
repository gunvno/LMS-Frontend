import { api, toQuery, wrap } from "@/lib/api-client";
import type { Notice, PageData } from "@/lib/types";

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
};

export type WebDeviceRegistration = {
  installationId: string;
  deviceType: "WEB";
  deviceId: string;
  appVersion: string;
};

function emptyPage(params: ListParams = {}): PageData<Notice> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: params.page ?? 0,
    size: params.size ?? 10,
  };
}

export const noticeService = {
  registerDevice(data: WebDeviceRegistration): Promise<void> {
    return api.post<void>("/notice/api/v1/devices/register", wrap(data));
  },

  deactivateDevice(installationId: string): Promise<void> {
    return api.post<void>(
      "/notice/api/v1/devices/deactivate",
      wrap({ installationId })
    );
  },

  async getMyNotices(params: ListParams = {}): Promise<PageData<Notice>> {
    const query = toQuery({
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort,
    });
    return (await api.get<PageData<Notice> | null>(`/notice/api/v1/notices/me?${query}`)) ?? emptyPage(params);
  },

  getUnreadCount(): Promise<number> {
    return api.get<number>("/notice/api/v1/notices/me/unread-count");
  },

  markRead(recipientId: string): Promise<void> {
    return api.post<void>(`/notice/api/v1/notices/${recipientId}/read`);
  },

  markAllRead(): Promise<void> {
    return api.post<void>("/notice/api/v1/notices/read-all");
  },
};
