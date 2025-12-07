'use client';

import { useState } from 'react';
import InventoryTable from './InventoryTable';
import AddItemModal from './AddItemModal';
import ReceiptScanner from './ReceiptScanner';
import styles from './InventoryTable.module.css';
import { logout } from '@/app/auth-actions';

export default function InventoryView({ initialItems }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>在庫管理</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => logout()}
                        className={styles.btn}
                        style={{ fontSize: '0.875rem' }}
                    >
                        ログアウト
                    </button>
                    <ReceiptScanner onScanComplete={() => window.location.reload()} />
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        + 商品を追加
                    </button>
                </div>
            </div>

            <InventoryTable initialItems={initialItems} />

            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </main>
    );
}
