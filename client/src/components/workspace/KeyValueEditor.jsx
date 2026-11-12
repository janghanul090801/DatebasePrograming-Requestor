import styled from 'styled-components';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';

const KeyValueEditor = ({
  rows,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  descriptionPlaceholder = 'Description (optional)',
  emptyText = '아직 추가된 항목이 없습니다.',
}) => {
  const updateRow = (index, field, value) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const removeRow = (index) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const addRow = () => {
    onChange([...rows, { key: '', value: '', description: '', enabled: true }]);
  };

  return (
    <Editor>
      <HeaderRow>
        <span />
        <ColumnTitle>KEY</ColumnTitle>
        <ColumnTitle>VALUE</ColumnTitle>
        <ColumnTitle>DESCRIPTION</ColumnTitle>
        <span />
      </HeaderRow>

      {rows.length === 0 ? (
        <EmptyText>{emptyText}</EmptyText>
      ) : (
        rows.map((row, index) => (
          <Row key={index} $disabled={row.enabled === false}>
            <Checkbox
              type="checkbox"
              checked={row.enabled !== false}
              onChange={(e) => updateRow(index, 'enabled', e.target.checked)}
              aria-label={`${index + 1}번째 행 사용 여부`}
            />
            <Input
              value={row.key ?? ''}
              onChange={(e) => updateRow(index, 'key', e.target.value)}
              placeholder={keyPlaceholder}
              spellCheck={false}
            />
            <Input
              value={row.value ?? ''}
              onChange={(e) => updateRow(index, 'value', e.target.value)}
              placeholder={valuePlaceholder}
              spellCheck={false}
            />
            <Input
              value={row.description ?? ''}
              onChange={(e) => updateRow(index, 'description', e.target.value)}
              placeholder={descriptionPlaceholder}
            />
            <DeleteButton type="button" onClick={() => removeRow(index)} title="행 삭제">
              <FaTrashAlt />
            </DeleteButton>
          </Row>
        ))
      )}

      <AddRowButton type="button" onClick={addRow}>
        <FaPlus />
        Add row
      </AddRowButton>
    </Editor>
  );
};

export default KeyValueEditor;

const Editor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-x: auto;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(120px, 1fr) minmax(160px, 1.3fr) minmax(120px, 1fr) 36px;
  align-items: center;
  min-width: 560px;
  padding: 7px 8px;
  border-bottom: 1px solid #ededed;
`;

const ColumnTitle = styled.span`
  padding: 0 8px;
  color: #9a9a9a;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(120px, 1fr) minmax(160px, 1.3fr) minmax(120px, 1fr) 36px;
  align-items: center;
  min-width: 560px;
  border-bottom: 1px solid #f1f1f1;
  opacity: ${(props) => (props.$disabled ? 0.45 : 1)};

  &:hover {
    background: #fafafa;
  }
`;

const Checkbox = styled.input`
  justify-self: center;
  width: 14px;
  height: 14px;
  accent-color: #ff6c37;
  cursor: pointer;
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 8px;
  border: none;
  border-left: 1px solid #f1f1f1;
  background: transparent;
  outline: none;
  color: #343a40;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 11px;

  &:focus {
    background: #fff8f4;
  }

  &::placeholder {
    color: #b7b7b7;
    font-family: 'Nanum Gothic', sans-serif;
  }
`;

const DeleteButton = styled.button`
  width: 26px;
  height: 26px;
  justify-self: center;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: transparent;
  color: #b0b0b0;
  font-size: 10px;

  &:hover {
    background: #fff0f0;
    color: #e03131;
  }
`;

const AddRowButton = styled.button`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  padding: 6px 9px;
  border-radius: 5px;
  background: transparent;
  color: #737373;
  font-size: 11px;
  font-weight: 700;

  &:hover {
    background: #f4f4f4;
    color: #ff6c37;
  }
`;

const EmptyText = styled.p`
  padding: 18px 10px;
  color: #a7a7a7;
  font-size: 11px;
`;
