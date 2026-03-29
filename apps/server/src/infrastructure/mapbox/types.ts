import type { MapboxProfile } from "@mapbox/mapbox-sdk/lib/classes/mapi-request";
import type { Effect } from "effect";
import type * as GeoJSON from "geojson";

import type { MapboxRoutingError } from "./errors";

/**
 * Position GeoJSON toi gian du cho route geometry.
 *
 * Mapbox Directions tra ve danh sach `[longitude, latitude]`.
 * Alias rieng giup code service no ro hon thay vi phai expose truc tiep GeoJSON namespace.
 */
export type MapboxGeoJsonPosition = GeoJSON.Position;

/**
 * Du lieu LineString toi gian dung cho route geometry.
 *
 * Alias ro nghia cho LineString tra ve tu Mapbox.
 */
export type MapboxGeoJsonLineString = GeoJSON.LineString;

/**
 * Du lieu MultiLineString toi gian dung cho route geometry.
 *
 * Alias ro nghia cho MultiLineString tra ve tu Mapbox.
 */
export type MapboxGeoJsonMultiLineString = GeoJSON.MultiLineString;

/**
 * Toa do chuan hoa ma infra Mapbox nhan vao.
 *
 * - `latitude` va `longitude` luon dung dinh dang so thap phan WGS84.
 * - Implementation se doi sang tuple `[longitude, latitude]` khi goi SDK.
 * - Cach tach type rieng giup service layer khong phai biet den shape tuple cua Mapbox.
 */
export type MapboxCoordinate = {
  readonly latitude: number;
  readonly longitude: number;
};

/**
 * Profile routing ma SDK Mapbox ho tro.
 *
 * - `walking`: di bo
 * - `cycling`: di xe dap
 * - `driving`: lai xe khong tinh live traffic
 * - `driving-traffic`: lai xe co traffic du doan
 *
 * TTL cache va cach rerank se dua tren profile nay.
 */
export type MapboxRoutingProfile = MapboxProfile;

/**
 * Dinh dang geometry ma `getRoute` co the tra ve.
 *
 * - `polyline6`: chuoi encoded nho gon, hop cho cache va network
 * - `geojson`: de debug hoac ve truc tiep len ban do
 */
export type MapboxRouteGeometryFormat = "geojson" | "polyline6";

/**
 * Geometry duoc chuan hoa sau khi goi Mapbox Directions.
 *
 * Implementation chi expose 2 nhom geometry ma app can quan tam:
 * - `string` khi dung `polyline6`
 * - `MapboxGeoJsonLineString` / `MapboxGeoJsonMultiLineString` khi dung `geojson`
 */
export type MapboxRouteGeometry
  = | string
    | MapboxGeoJsonLineString
    | MapboxGeoJsonMultiLineString;

/**
 * Input cho use case lay 1 route cu the.
 *
 * Origin va destination la 2 diem dau-cuoi.
 * `geometryFormat` la optional vi implementation mac dinh dung `polyline6`
 * de tiet kiem kich thuoc cache va payload.
 */
export type MapboxRouteRequest = {
  readonly origin: MapboxCoordinate;
  readonly destination: MapboxCoordinate;
  readonly profile: MapboxRoutingProfile;
  readonly geometryFormat?: MapboxRouteGeometryFormat;
};

/**
 * Ket qua da duoc chuan hoa cho 1 route.
 *
 * - `distanceMeters`: quang duong theo duong di that
 * - `durationSeconds`: thoi gian du kien
 * - `geometry`: duong line de dung cho map / cache / render
 * - `geometryFormat`: cho caller biet can decode hay doc truc tiep
 */
export type MapboxRoutePath = {
  readonly distanceMeters: number;
  readonly durationSeconds: number;
  readonly geometryFormat: MapboxRouteGeometryFormat;
  readonly geometry: MapboxRouteGeometry;
};

/**
 * Input cho matrix 1-nhieu diem den.
 *
 * Use case chinh la rerank candidate theo duong di that.
 * `destinations` giu nguyen thu tu de ket qua co the map nguoc lai bang `destinationIndex`.
 */
export type MapboxMatrixRequest = {
  readonly origin: MapboxCoordinate;
  readonly destinations: ReadonlyArray<MapboxCoordinate>;
  readonly profile: MapboxRoutingProfile;
};

/**
 * 1 o trong ma tran ket qua.
 *
 * - `destinationIndex` tro ve vi tri cua destination trong input ban dau
 * - `distanceMeters` / `durationSeconds` co the `null` neu Mapbox khong route duoc diem do
 *
 * Cach nay giup caller rerank ma khong mat lien ket voi danh sach candidate goc.
 */
export type MapboxMatrixEntry = {
  readonly destinationIndex: number;
  readonly distanceMeters: number | null;
  readonly durationSeconds: number | null;
};

/**
 * Contract ma infra service expose cho app.
 *
 * Chu y: service khong leak raw response shape cua SDK.
 * No chi tra ve du lieu da chuan hoa de:
 * - cache de dang hon
 * - de thay provider sau nay
 * - domain/service layer khong phai hoc API shape cua Mapbox
 */
export type MapboxRoutingService = {
  /**
   * Lay 1 tuyen duong cu the giua 2 diem.
   *
   * Cach dung:
   * - Dung khi can route geometry that su de ve len ban do.
   * - Dung khi can distance/duration cua 1 cap origin-destination.
   *
   * Dau vao:
   * - `origin`: diem bat dau
   * - `destination`: diem ket thuc
   * - `profile`: che do routing (`walking` / `cycling` / `driving` / `driving-traffic`)
   * - `geometryFormat`: tuy chon, mac dinh la `polyline6`
   *
   * Dau ra da duoc chuan hoa:
   * - `distanceMeters`
   * - `durationSeconds`
   * - `geometryFormat`
   * - `geometry`
   */
  readonly getRoute: (args: MapboxRouteRequest) => Effect.Effect<MapboxRoutePath, MapboxRoutingError, never>;

  /**
   * Lay ma tran 1-goc -> nhieu diem den de rerank candidate.
   *
   * Cach dung:
   * - Dung khi can so sanh nhieu station / technician team / candidate cung luc.
   * - Khong tra ve geometry, chi tra metric de xep hang.
   *
   * Dau vao:
   * - `origin`: diem xuat phat
   * - `destinations`: danh sach diem den, giu nguyen thu tu ban dau
   * - `profile`: che do routing
   *
   * Dau ra:
   * - moi entry co `destinationIndex` de map nguoc lai `destinations[index]`
   * - `distanceMeters` va `durationSeconds` co the `null` neu diem do khong route duoc
   */
  readonly getMatrix: (args: MapboxMatrixRequest) => Effect.Effect<ReadonlyArray<MapboxMatrixEntry>, MapboxRoutingError, never>;
};

export type MatrixCachePayload = {
  readonly entries: ReadonlyArray<MapboxMatrixEntry>;
};
