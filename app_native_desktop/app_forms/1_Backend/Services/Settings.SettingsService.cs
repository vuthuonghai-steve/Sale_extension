using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Utils;
using AppForms.Shared.Common;
using AppForms.Shared.Constants;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services;

public class SettingsService : ISettingsService
{
    private readonly ILogger<SettingsService> _logger;
    private readonly string _settingsFilePath;
    private AppSettings _currentSettings;

    public AppSettings Current => _currentSettings;
    public event EventHandler? SettingsSaved;

    public SettingsService(ILogger<SettingsService> logger)
    {
        _logger = logger;
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var dir = Path.Combine(appData, "SaleLeadFormConverter");
        Directory.CreateDirectory(dir);
        _settingsFilePath = Path.Combine(dir, AppConstants.SettingsFileName);
        _currentSettings = new AppSettings();
        Load();
    }

    public Result Load()
    {
        try
        {
            if (File.Exists(_settingsFilePath))
            {
                var content = File.ReadAllText(_settingsFilePath);
                var desResult = JsonUtils.Deserialize<AppSettings>(content);
                if (desResult.IsSuccess && desResult.Value != null)
                {
                    _currentSettings = desResult.Value;
                    _logger.LogInformation("Cấu hình được tải thành công từ {Path}", _settingsFilePath);
                    return Result.Success();
                }
            }
            _currentSettings = new AppSettings();
            Save();
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tải cấu hình");
            return Result.Failure(ex.Message);
        }
    }

    public Result Save()
    {
        try
        {
            var json = JsonUtils.Serialize(_currentSettings, indented: true);
            File.WriteAllText(_settingsFilePath, json);
            _logger.LogInformation("Cấu hình đã được lưu tại {Path}", _settingsFilePath);
            SettingsSaved?.Invoke(this, EventArgs.Empty);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lưu cấu hình");
            return Result.Failure(ex.Message);
        }
    }

    public Result Update(Action<AppSettings> updateAction)
    {
        try
        {
            updateAction(_currentSettings);
            return Save();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi cập nhật cấu hình");
            return Result.Failure(ex.Message);
        }
    }

    public Result SetFixedCtvName(string ctvName)
    {
        if (string.IsNullOrWhiteSpace(ctvName))
        {
            return Result.Failure("Tên CTV không được để trống.");
        }

        return Update(s => s.FixedCtvName = ctvName.Trim());
    }
}
