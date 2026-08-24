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

        SpecialRoomMappingEntity? match = null;

        // 1. Quét ưu tiên theo Mã phòng được bóc tách trong Lead
        if (!string.IsNullOrWhiteSpace(lead?.RoomCode))
        {
            match = _repository.FindMappingByCode(lead.RoomCode);
            if (match != null)
            {
                _logger.LogDebug("Nhận diện mã đặc biệt theo RoomCode '{RoomCode}' thành công (STT: {Stt})", lead.RoomCode, match.Stt);
                return match;
            }
        }

        // 2. Quét quét trong toàn bộ nội dung văn bản thô (Raw Text)
        if (match == null && !string.IsNullOrWhiteSpace(rawText))
        {
            match = _textParser.FindMappingInText(rawText, _repository);
            if (match != null)
            {
                _logger.LogDebug("Nhận diện mã đặc biệt qua RawText thành công (STT: {Stt})", match.Stt);
                return match;
            }
        }

        // 3. Quét theo Số điện thoại khách hàng / liên hệ trong Lead
        if (match == null && !string.IsNullOrWhiteSpace(lead?.CustomerPhone))
        {
            match = _repository.FindMappingByPhone(lead.CustomerPhone);
            if (match != null)
            {
                _logger.LogDebug("Nhận diện mã đặc biệt theo Phone '{Phone}' thành công (STT: {Stt})", lead.CustomerPhone, match.Stt);
                return match;
            }
        }

        return null;
    }
}
