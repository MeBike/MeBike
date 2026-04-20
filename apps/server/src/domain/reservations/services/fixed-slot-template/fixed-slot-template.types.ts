import type { Effect } from "effect";

import type { FixedSlotTemplateFilter, FixedSlotTemplateRow } from "@/domain/reservations/models";
import type { FixedSlotTemplateStartOutsideOperatingHours } from "@/domain/shared";
import type { PageResult } from "@/domain/shared/pagination";
import type { Prisma } from "@/infrastructure/prisma";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  FixedSlotTemplateCancelConflict,
  FixedSlotTemplateConflict,
  FixedSlotTemplateDateLocked,
  FixedSlotTemplateDateNotFound,
  FixedSlotTemplateDateNotFuture,
  FixedSlotTemplateNotFound,
  FixedSlotTemplateStationNotFound,
  FixedSlotTemplateUpdateConflict,
} from "../../domain-errors";

export type FixedSlotBillingResult = {
  readonly pricingPolicyId: string;
  readonly subscriptionId: string | null;
  readonly prepaid: PrismaTypes.Decimal;
};

export type FixedSlotTemplateService = {
  /**
   * Tao fixed-slot template moi va charge upfront cho toan bo ngay duoc chon.
   *
   * @param args Dau vao tao template.
   * @param args.userId ID user so huu template.
   * @param args.stationId ID station ap dung cho template.
   * @param args.slotStart Gio bat dau, dang `HH:mm`.
   * @param args.slotDates Danh sach ngay, dang `YYYY-MM-DD`.
   * @param args.now Moc thoi gian hien tai de validate ngay tuong lai.
   * @returns Effect tra ve template vua tao, hoac fail neu station/slot/billing khong hop le.
   */
  createForUser: (args: {
    userId: string;
    stationId: string;
    slotStart: string;
    slotDates: ReadonlyArray<string>;
    now?: Date;
  }) => Effect.Effect<
    FixedSlotTemplateRow,
    | FixedSlotTemplateStationNotFound
    | FixedSlotTemplateDateNotFuture
    | FixedSlotTemplateStartOutsideOperatingHours
    | FixedSlotTemplateConflict,
    Prisma
  >;

  /**
   * Lay mot template cua user theo ID.
   *
   * @param args Dau vao truy van.
   * @param args.userId ID user so huu template.
   * @param args.templateId ID template can lay.
   * @returns Effect tra ve template, hoac fail neu template khong ton tai.
   */
  getByIdForUser: (args: {
    userId: string;
    templateId: string;
  }) => Effect.Effect<FixedSlotTemplateRow, FixedSlotTemplateNotFound>;

  /**
   * Liet ke template cua user theo bo loc va phan trang.
   *
   * @param args Dau vao truy van danh sach.
   * @param args.userId ID user so huu template.
   * @param args.filter Bo loc status/station.
   * @param args.page Trang hien tai.
   * @param args.pageSize So phan tu moi trang.
   * @returns Effect tra ve page result cua template.
   */
  listForUser: (args: {
    userId: string;
    filter: FixedSlotTemplateFilter;
    page?: number;
    pageSize?: number;
  }) => Effect.Effect<PageResult<FixedSlotTemplateRow>>;

  /**
   * Huy ca template va pending reservation lien quan cua user.
   *
   * @param args Dau vao huy template.
   * @param args.userId ID user so huu template.
   * @param args.templateId ID template can huy.
   * @param args.now Moc thoi gian hien tai cho update status.
   * @returns Effect tra ve template sau khi huy, hoac fail neu khong tim thay / conflict khi huy.
   */
  cancelForUser: (args: {
    userId: string;
    templateId: string;
    now?: Date;
  }) => Effect.Effect<
    FixedSlotTemplateRow,
    FixedSlotTemplateNotFound | FixedSlotTemplateCancelConflict,
    Prisma
  >;

  /**
   * Cap nhat gio bat dau hoac danh sach ngay cua template.
   * Ngay moi them vao chi cap nhat lich; billing se xay ra luc worker materialize reservation theo ngay.
   *
   * @param args Dau vao update template.
   * @param args.userId ID user so huu template.
   * @param args.templateId ID template can update.
   * @param args.slotStart Gio moi, dang `HH:mm`.
   * @param args.slotDates Danh sach ngay moi, dang `YYYY-MM-DD`.
   * @param args.now Moc thoi gian hien tai de khoa ngay da qua / hom nay.
   * @returns Effect tra ve template sau khi update, hoac fail neu validation/billing/mutation conflict.
   */
  updateForUser: (args: {
    userId: string;
    templateId: string;
    slotStart?: string;
    slotDates?: ReadonlyArray<string>;
    now?: Date;
  }) => Effect.Effect<
    FixedSlotTemplateRow,
    | FixedSlotTemplateNotFound
    | FixedSlotTemplateDateNotFuture
    | FixedSlotTemplateDateLocked
    | FixedSlotTemplateStartOutsideOperatingHours
    | FixedSlotTemplateConflict
    | FixedSlotTemplateUpdateConflict,
    Prisma
  >;

  /**
   * Xoa mot ngay khoi template.
   * Khong refund o flow hien tai.
   *
   * @param args Dau vao xoa ngay.
   * @param args.userId ID user so huu template.
   * @param args.templateId ID template can sua.
   * @param args.slotDate Ngay can xoa, dang `YYYY-MM-DD`.
   * @param args.now Moc thoi gian hien tai de khoa ngay da qua / hom nay.
   * @returns Effect tra ve template sau khi xoa ngay, hoac fail neu ngay khong hop le / mutation conflict.
   */
  removeDateForUser: (args: {
    userId: string;
    templateId: string;
    slotDate: string;
    now?: Date;
  }) => Effect.Effect<
    FixedSlotTemplateRow,
    | FixedSlotTemplateNotFound
    | FixedSlotTemplateDateLocked
    | FixedSlotTemplateDateNotFound
    | FixedSlotTemplateConflict
    | FixedSlotTemplateUpdateConflict,
    Prisma
  >;
};
