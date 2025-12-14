'use client';

import { useState } from 'react';
import InventoryTable from './InventoryTable';
import AddItemModal from './AddItemModal';
import ReceiptScanner from './ReceiptScanner';
import styles from './InventoryTable.module.css';
import { logout } from '@/app/auth-actions';

export default function InventoryView({ initialItems }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeCategory, setActiveCategory] = useState('すべて');

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('本当に削除しますか？')) {
            const { deleteItem } = await import('@/app/actions');
            await deleteItem(id);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const categories = ['すべて', ...new Set(initialItems.map(item => item.category).filter(Boolean))];
    const displayedItems = activeCategory === 'すべて'
        ? initialItems
        : initialItems.filter(item => item.category === activeCategory);

    return (
        <main className={styles.mainContainer} style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>在庫管理</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => logout()}
                        className={styles.btn}
                        style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                    >
                        ログアウト
                    </button>
                    <ReceiptScanner onScanComplete={() => window.location.reload()} />
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', whiteSpace: 'nowrap' }}
                        onClick={handleAdd}
                    >
                        + 追加
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            background: activeCategory === cat ? 'var(--primary)' : 'var(--card-bg)',
                            color: activeCategory === cat ? 'white' : 'var(--text)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <InventoryTable
                initialItems={displayedItems}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editItem={editingItem}
            />
        </main>
    );
}
