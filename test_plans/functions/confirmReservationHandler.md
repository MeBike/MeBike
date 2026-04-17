# Test Cases cho Hàm: `confirmReservationHandler`

**Nằm trong file**: me.controller.ts
**Function Code**: FUNC_CONFIRMRESERVATIONHANDLER
**Function Name**: `confirmReservationHandler`

---

### 1. Test Cases (Danh sách chi tiết)

#### TC_001: Khởi tạo/Thực thi thành công (Normal Flow)
**a. Condition:**
- **Precondition**: Dữ liệu đầu vào và trạng thái nghiệp vụ hoàn toàn hợp lệ.
- **Values of inputs (Normal)**: Các thông số bắt buộc (query, param, body) điền đúng định dạng và logic.
**b. Confirmation:**
- **Output result**: Lệnh xử lý thành công, API trả về HTTP 200/201 kèm dữ liệu kết quả.
**c. Type & Result:**
- **Type**: Normal
- **Result**: [ ] P / F

#### TC_002: Xử lý ngoại lệ `ReservationConfirmBlockedByActiveRental` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReservationConfirmBlockedByActiveRental` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReservationConfirmBlockedByActiveRental`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_003: Xử lý ngoại lệ `ReservationNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReservationNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReservationNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_004: Xử lý ngoại lệ `ReservationNotOwned` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReservationNotOwned` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReservationNotOwned`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_005: Xử lý ngoại lệ `ReservationMissingBike` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReservationMissingBike` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReservationMissingBike`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_006: Xử lý ngoại lệ `InvalidReservationTransition` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `InvalidReservationTransition` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `InvalidReservationTransition`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_007: Xử lý ngoại lệ `BikeNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `BikeNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `BikeNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_008: Xử lý ngoại lệ `BikeNotAvailable` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `BikeNotAvailable` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `BikeNotAvailable`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_009: Xử lý ngoại lệ `WalletNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `WalletNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `WalletNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_010: Xử lý ngoại lệ `InsufficientWalletBalance` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `InsufficientWalletBalance` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `InsufficientWalletBalance`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

