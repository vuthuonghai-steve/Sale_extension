namespace AppForms.Shared.Types;

public enum AppState
{
    Initializing,
    Ready,
    Listening,
    Paused,
    Stopped,
    Error
}

public enum ClipboardDataType
{
    Text,
    Json,
    Html,
    Image,
    FileList,
    Unknown
}

public enum NotificationSeverity
{
    Info,
    Success,
    Warning,
    Error
}
