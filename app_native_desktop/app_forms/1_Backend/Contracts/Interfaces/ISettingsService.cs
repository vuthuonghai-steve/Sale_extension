using AppForms.Backend.Contracts.Entities;
using AppForms.Shared.Common;

namespace AppForms.Backend.Contracts.Interfaces;

public interface ISettingsService
{
    AppSettings Current { get; }
    Result Save();
    Result Load();
    Result Update(Action<AppSettings> updateAction);
    Result SetFixedCtvName(string ctvName);
}
