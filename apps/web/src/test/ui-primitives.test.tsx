import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActionLink, ActionTile, Button, IconButton } from '../components/ui';

describe('shared control primitives', () => {
  it('renders button variants and busy state accessibly', () => {
    const { rerender } = render(<Button variant="danger">刪除</Button>);
    expect(screen.getByRole('button', { name: '刪除' })).toHaveClass('bg-[var(--ui-danger)]');

    rerender(<Button busy>儲存</Button>);
    expect(screen.getByRole('button', { name: '處理中…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '處理中…' })).toHaveAttribute('aria-busy', 'true');
  });

  it('requires a labelled 48px icon button and keeps link semantics', () => {
    render(
      <>
        <IconButton aria-label="編輯"><span aria-hidden="true">✎</span></IconButton>
        <ActionLink href="/settings" variant="ghost">前往設定</ActionLink>
        <ActionTile href="/add" icon={<span aria-hidden="true">＋</span>} title="新增物品" description="建立一筆資料" />
      </>,
    );

    expect(screen.getByRole('button', { name: '編輯' })).toHaveClass('h-12', 'w-12');
    expect(screen.getByRole('link', { name: '前往設定' })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('link', { name: /新增物品/ })).toHaveAttribute('href', '/add');
  });
});
