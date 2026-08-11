namespace AppForms.Shared.Common;

/// <summary>
/// Đại diện cho kết quả của một tác vụ (Success hoặc Failure) mà không cần ném Exception
/// </summary>
public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string Error { get; }

    protected Result(bool isSuccess, string error)
    {
        if (isSuccess && !string.IsNullOrEmpty(error))
            throw new InvalidOperationException("Thao tác thành công không thể chứa thông báo lỗi.");
        if (!isSuccess && string.IsNullOrEmpty(error))
            throw new InvalidOperationException("Thao tác thất bại bắt buộc phải có thông báo lỗi.");

        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, string.Empty);
    public static Result Failure(string error) => new(false, error);
}

/// <summary>
/// Đại diện cho kết quả của một tác vụ mang giá trị trả về
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu của giá trị</typeparam>
public class Result<T> : Result
{
    private readonly T? _value;

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException($"Không thể truy xuất giá trị khi tác vụ thất bại: {Error}");

    protected internal Result(T? value, bool isSuccess, string error)
        : base(isSuccess, error)
    {
        _value = value;
    }

    public static Result<T> Success(T value) => new(value, true, string.Empty);
    public static new Result<T> Failure(string error) => new(default, false, error);
}
