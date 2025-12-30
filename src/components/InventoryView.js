'use client';

import { useState } from 'react';
import InventoryTable from './InventoryTable';
import AddItemModal from './AddItemModal';
import ReceiptScanner from './ReceiptScanner';
import styles from './InventoryView.module.css';
import { logout } from '@/app/auth-actions';
import { rubyImages } from '@/assets/rubyImages';

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
                    <svg className={styles.catLogo} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2c0 1.65-1.35 3-3 3S8 3.65 8 2c0-1.65 1.35-3 3-3s3 1.35 3 3zm6 4c0 1.65-1.35 3-3 3s-3-1.35-3-3 1.35-3 3-3 3 1.35 3 3zM6 9c1.65 0 3-1.35 3-3S7.65 3 6 3 3 4.35 3 6s1.35 3 3 3zm6.5 2c3.03 0 5.5 2.47 5.5 5.5v1.25c0 1.79-1.46 3.25-3.25 3.25h-5.5C7.46 21 6 19.54 6 17.75V16.5C6 13.47 8.47 11 11.5 11z" />
                    </svg>
                    <h1 className={styles.title}>うしねこの蔵</h1>
                </div>
                {/* Decorative Ruby Image (Top Right Poking) */}
                <div style={{ position: 'absolute', top: '-10px', right: '20px', width: '60px', zIndex: 0, transform: 'rotate(10deg)', pointerEvents: 'none' }}>
                    <img src={rubyImages['01']} alt="" style={{ width: '100%', height: 'auto' }} />
                </div>
                <div style={{ position: 'absolute', top: '50px', left: '20px', width: '50px', zIndex: 0, transform: 'rotate(-15deg)', pointerEvents: 'none' }}>
                    <img src={rubyImages['04']} alt="" style={{ width: '100%', height: 'auto', opacity: 0.6 }} />
                </div>

                <div className={styles.controls}>
                    <ReceiptScanner onScanComplete={() => window.location.reload()} />
                    <button
                        onClick={handleAdd}
                        className={`${styles.btnAdd} btn-paw`}
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

            <footer className={styles.footer}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'flex-end' }}>
                    <img src={rubyImages['08']} alt="Ruby" className={styles.footerImage} style={{ height: '60px' }} />
                    <img src={rubyImages['09']} alt="Ruby" className={styles.footerImage} style={{ height: '50px' }} />
                </div>
                <p>© 2025 うしねこの蔵 with Ruby</p>
            </footer>

            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editItem={editingItem}
            />
        </main>
    );
}
