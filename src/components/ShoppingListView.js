'use client';

import { useState, useRef } from 'react';
import styles from './ShoppingListView.module.css';
import { addShoppingItem, toggleShoppingItem, deleteShoppingItem } from '@/app/actions';
import Link from 'next/link';

export default function ShoppingListView({ initialList, candidates }) {
    const [newItemName, setNewItemName] = useState('');
    const [optimisticList, setOptimisticList] = useState(initialList);
    const formRef = useRef(null);

    const handleAdd = async (formData) => {
        const name = formData.get('name');
        if (!name) return;

        // Optimistic update
        const tempId = crypto.randomUUID();
        const newItem = {
            id: tempId,
            name: name,
            checked: false,
            created_at: new Date().toISOString()
        };
        setOptimisticList([...optimisticList, newItem]);
        setNewItemName('');
        formRef.current?.reset();

        await addShoppingItem(name);
        // We rely on revalidatePath in server action, but for specific ID synchronization we might just refresh or wait
    };

    const handleToggle = async (id, currentChecked) => {
        const newList = optimisticList.map(item =>
            item.id === id ? { ...item, checked: !currentChecked } : item
        );
        setOptimisticList(newList);
        await toggleShoppingItem(id, !currentChecked);
    };

    const handleDelete = async (id) => {
        const newList = optimisticList.filter(item => item.id !== id);
        setOptimisticList(newList);
        await deleteShoppingItem(id);
    };

    const handleAddCandidate = async (name) => {
        const tempId = crypto.randomUUID();
        const newItem = {
            id: tempId,
            name: name,
            checked: false,
            created_at: new Date().toISOString()
        };
        setOptimisticList([...optimisticList, newItem]);
        await addShoppingItem(name);
    };

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <Link href="/" className={styles.backLink}>← 在庫一覧に戻る</Link>
                <h1 className={styles.title}>お買い物メモ</h1>
            </div>

            <section className={styles.inputSection}>
                <form action={handleAdd} ref={formRef} className={styles.form}>
                    <input
                        type="text"
                        name="name"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="買うものを入力..."
                        className={styles.input}
                        required
                    />
                    <button type="submit" className={styles.addButton}>追加</button>
                </form>
            </section>

            <section className={styles.listSection}>
                {optimisticList.length === 0 ? (
                    <p className={styles.empty}>メモはありません</p>
                ) : (
                    <ul className={styles.list}>
                        {optimisticList.map(item => (
                            <li key={item.id} className={`${styles.listItem} ${item.checked ? styles.checked : ''}`}>
                                <label className={styles.label}>
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleToggle(item.id, item.checked)}
                                        className={styles.checkbox}
                                    />
                                    <span className={styles.itemName}>{item.name}</span>
                                </label>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className={styles.deleteButton}
                                    aria-label="削除"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {candidates && candidates.length > 0 && (
                <section className={styles.candidatesSection}>
                    <h2 className={styles.candidatesTitle}>そろそろ無くなるかも？</h2>
                    <div className={styles.candidatesList}>
                        {candidates.map(item => (
                            <div key={item.id} className={styles.candidateCard}>
                                <div className={styles.candidateInfo}>
                                    <span className={styles.candidateName}>{item.name}</span>
                                    <span className={styles.candidateReason}>
                                        {item.quantity <= item.threshold
                                            ? `残り${item.quantity}${item.unit}`
                                            : `予測: ${new Date(item.predicted_next_purchase).toLocaleDateString()}`}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleAddCandidate(item.name)}
                                    className={styles.addCandidateButton}
                                >
                                    追加
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
