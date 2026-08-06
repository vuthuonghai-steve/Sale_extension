import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, onClear }) => {
  return (
    <div
      style={{
        padding: '10px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          placeholder="Tìm kiếm tin nhắn..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '12px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            outline: 'none',
          }}
        />
        <button
          onClick={onClear}
          style={{
            padding: '6px 10px',
            fontSize: '12px',
            backgroundColor: '#fff1f0',
            color: '#ff4d4f',
            border: '1px solid #ffa39e',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Xóa hết
        </button>
      </div>
    </div>
  );
};
