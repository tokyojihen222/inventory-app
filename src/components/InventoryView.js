'use client';

import { useState, useEffect } from 'react';
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
    const [footerImage, setFooterImage] = useState(null);

    useEffect(() => {
        // Randomly select one ruby image for the footer
        const keys = Object.keys(rubyImages).filter(k => k !== 'メイン'); // Exclude main if needed, or include all
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        setFooterImage(rubyImages[randomKey]);
    }, []);

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
                    <img src={rubyImages['04']} alt="Logo" style={{ width: '50px', height: 'auto', marginRight: '10px' }} />
                    <h1 className={styles.title}>うしねこの蔵</h1>
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
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: '60px' }}>
                    {footerImage && (
                        <img src={footerImage} alt="Ruby" className={styles.footerImage} style={{ height: '60px' }} />
                    )}
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
