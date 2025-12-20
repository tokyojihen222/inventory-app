'use client';

import { useState } from 'react';
import InventoryTable from './InventoryTable';
import AddItemModal from './AddItemModal';
import ReceiptScanner from './ReceiptScanner';
import styles from './InventoryView.module.css';
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
        <main className={styles.mainContainer}>
            <div className={styles.header}>
                <div className={styles.brand}>
                    <svg className={styles.catLogo} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" opacity="0.1" />
                        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                        <path d="M10 14C10 14 11 15 12 15C13 15 14 14 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M4 8L3 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M20 8L21 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h1 className={styles.title}>Cosmic Inventory</h1>
                </div>

                <div className={styles.controls}>
                    <ReceiptScanner onScanComplete={() => window.location.reload()} />
                    <button
                        onClick={handleAdd}
                        className={styles.btnAdd}
                    >
                        <span>+</span>
                        <span>追加</span>
                    </button>
                    <button
                        onClick={() => logout()}
                        className={styles.btnLogout}
                    >
                        ログアウト
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className={styles.categoryTabs}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
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
