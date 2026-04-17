# Test Cases cho Hàm: `confirmRentalReturnByOperatorHandler`

**Nằm trong file**: admin.controller.ts
**Function Code**: FUNC_CONFIRMRENTALRETURNBYOPERATORHANDLER
**Function Name**: `confirmRentalReturnByOperatorHandler`

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

#### TC_002: Xử lý ngoại lệ `RentalNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `RentalNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `RentalNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_003: Xử lý ngoại lệ `UnauthorizedRentalAccess` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `UnauthorizedRentalAccess` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `UnauthorizedRentalAccess`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_004: Xử lý ngoại lệ `ReturnSlotRequiredForReturn` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReturnSlotRequiredForReturn` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReturnSlotRequiredForReturn`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_005: Xử lý ngoại lệ `ReturnSlotCapacityExceeded` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReturnSlotCapacityExceeded` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReturnSlotCapacityExceeded`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_006: Xử lý ngoại lệ `ReturnSlotStationMismatch` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReturnSlotStationMismatch` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReturnSlotStationMismatch`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_007: Xử lý ngoại lệ `StationNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `StationNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `StationNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_008: Xử lý ngoại lệ `ReturnAlreadyConfirmed` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ReturnAlreadyConfirmed` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ReturnAlreadyConfirmed`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_009: Xử lý ngoại lệ `InvalidRentalState` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `InvalidRentalState` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `InvalidRentalState`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_010: Xử lý ngoại lệ `UserWalletNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `UserWalletNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `UserWalletNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_011: Xử lý ngoại lệ `InsufficientBalanceToRent` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `InsufficientBalanceToRent` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `InsufficientBalanceToRent`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

