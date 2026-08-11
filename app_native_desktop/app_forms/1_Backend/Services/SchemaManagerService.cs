using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Shared.Common;

namespace AppForms.Backend.Services;

public class SchemaManagerService : ISchemaManager
{
    private readonly List<FormatSchema> _schemas = new();

    public IReadOnlyList<FormatSchema> Schemas
    {
        get
        {
            lock (_schemas)
            {
                return _schemas.ToList();
            }
        }
    }

    public SchemaManagerService()
    {
        _schemas.AddRange(DefaultSchemas.GetAllDefaultSchemas());
    }

    public FormatSchema? GetSchemaById(string id)
    {
        lock (_schemas)
        {
            return _schemas.FirstOrDefault(s => string.Equals(s.Id, id, StringComparison.OrdinalIgnoreCase));
        }
    }

    public Result RegisterSchema(FormatSchema schema)
    {
        if (schema == null || string.IsNullOrWhiteSpace(schema.Id))
        {
            return Result.Failure("Schema không hợp lệ.");
        }

        lock (_schemas)
        {
            var existingIndex = _schemas.FindIndex(s => string.Equals(s.Id, schema.Id, StringComparison.OrdinalIgnoreCase));
            if (existingIndex >= 0)
            {
                _schemas[existingIndex] = schema;
            }
            else
            {
                _schemas.Add(schema);
            }
        }
        return Result.Success();
    }
}
