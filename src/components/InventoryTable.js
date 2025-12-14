'use client';

import { useState } from 'react';
import styles from './InventoryTable.module.css';
import { updateInventory } from '@/app/actions';

export default function InventoryTable({ initialItems, onEdit, onDelete }) {
    const [items, setItems] = useState(initialItems);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'category', direction: 'asc' });

    if (initialItems !== items) {
        setItems(initialItems);
    }

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleIncrement = async (id) => {
        await updateInventory(id, 1, 'purchase');
    };

    const handleDecrement = async (id) => {
        await updateInventory(id, -1, 'consume');
    };

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <input
                    type="text"
                    placeholder="検索..."
                    className={styles.search}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')}>商品名</th>
                        <th onClick={() => handleSort('category')}>カテゴリ</th>
                        <th onClick={() => handleSort('quantity')}>在庫数</th>
                        <th>次回購入予測</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedItems.map((item) => (
                        <tr key={item.id}>
                            <td data-label="商品名">{item.name}</td>
                            <td data-label="カテゴリ">{item.category}</td>
                            <td data-label="在庫数" className={item.quantity <= item.threshold ? styles.lowStock : ''}>
                                {item.quantity}
                            </td>
                            <td data-label="次回購入予測">
                                {item.predicted_next_purchase ? (
                                    <span title={new Date(item.predicted_next_purchase).toLocaleDateString()}>
                                        {new Date(item.predicted_next_purchase).toLocaleDateString()}
                                    </span>
                                ) : '-'}
                            </td>
                            <td className={styles.actions}>
                                <button className={`${styles.btn} ${styles.btnIcon}`} onClick={() => handleDecrement(item.id)}>-</button>
                                <button className={`${styles.btn} ${styles.btnIcon}`} onClick={() => handleIncrement(item.id)}>+</button>
                                <button className={`${styles.btn} ${styles.btnIcon} ${styles.btnEdit}`} onClick={() => onEdit(item)}>✏️</button>
                                <button className={`${styles.btn} ${styles.btnIcon} ${styles.btnDelete}`} onClick={() => onDelete(item.id)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
