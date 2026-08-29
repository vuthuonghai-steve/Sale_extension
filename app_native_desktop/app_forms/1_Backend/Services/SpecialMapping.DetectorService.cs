using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.SpecialMapping;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services;

/// <summary>
/// Triển khai Domain Service nhận diện mã đặc biệt với thuật toán ưu tiên khớp Fallback.
/// </summary>
public class SpecialRoomMappingDetector : ISpecialRoomMappingDetector
{
    private readonly ISpecialRoomMappingRepository _repository;
    private readonly ISpecialMappingTextParser _textParser;
    private readonly ILogger<SpecialRoomMappingDetector> _logger;

    public SpecialRoomMappingDetector(
        ISpecialRoomMappingRepository repository,
        ISpecialMappingTextParser textParser,
        ILogger<SpecialRoomMappingDetector> logger)
    {
        _repository = repository;
        _textParser = textParser;
        _logger = logger;
    }

    public SpecialRoomMappingEntity? Detect(LeadEntity? lead, string? rawText = null)
    {
        if (lead == null && string.IsNullOrWhiteSpace(rawText))
        {
            return null;
        }

        // 1. Quét ưu tiên theo Mã phòng được bóc tách trong Lead
        if (!string.IsNullOrWhiteSpace(lead?.RoomCode))
        {
            var match = _repository.FindMappingByCode(lead.RoomCode);
            if (match != null)
            {
                _logger.LogDebug("Nhận diện mã đặc biệt theo RoomCode '{RoomCode}' thành công (STT: {Stt})", lead.RoomCode, match.Stt);
                return match;
            }

            // Chuẩn hóa nghiệp vụ: Khi form đã bóc tách được trường RoomCode cố định nhưng không khớp mã đặc biệt,
            // DỪNG LẠI, không fallback quét toàn bộ văn bản thô để tránh lấy nhầm số nhà/ngõ/ngách/ngày giờ.
            _logger.LogDebug("RoomCode '{RoomCode}' không thuộc danh mục mã đặc biệt. Dừng nhận diện.", lead.RoomCode);
            return null;
        }

        // 2. Chỉ quét trong văn bản thô (Raw Text) khi KHÔNG bóc tách được trường RoomCode (văn bản tự do)
        if (!string.IsNullOrWhiteSpace(rawText))
        {
            var match = _textParser.FindMappingInText(rawText, _repository);
            if (match != null)
            {
                _logger.LogDebug("Nhận diện mã đặc biệt qua RawText thành công (STT: {Stt})", match.Stt);
                return match;
            }
        }

        return null;
    }
}
