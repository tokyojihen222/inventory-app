'use client';

import { useState } from 'react';
import styles from './AddItemModal.module.css';
import { addItem, updateItem } from '@/app/actions';
import { rubyImages } from '@/assets/rubyImages';

export default function AddItemModal({ isOpen, onClose, editItem = null }) {
    if (!isOpen) return null;

    const handleSubmit = async (formData) => {
        try {
            if (editItem) {
                await updateItem(editItem.id, formData);
            } else {
                await addItem(formData);
            }
            onClose();
        } catch (e) {
            alert(e.message);
        }
    };

    // Import updateItem here or ensure it's imported at top level
    // Since we are replacing content, we need to make sure imports are correct.
    // However, the tool shows I'm only replacing function body.
    // I need to be careful about imports.
    // Actually, I should use multi_replace to fix imports too.
    // Or assume the user context handles imports?
    // Wait, the previous file view showed `import { addItem } from '@/app/actions';`
    // I need to add `updateItem` to imports.

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ position: 'relative', overflow: 'visible' }}>
                <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                    <img src={rubyImages['05']} alt="" style={{ width: '100px', height: 'auto' }} />
                </div>
                {/* Side decorations */}
                {/* Side decorations */}
                <img src={rubyImages['11']} alt="" style={{ position: 'absolute', bottom: '10px', left: '10px', width: '50px', height: 'auto', opacity: 0.8, pointerEvents: 'none', zIndex: 0 }} />
                <img src={rubyImages['12']} alt="" style={{ position: 'absolute', top: '10px', right: '10px', width: '40px', height: 'auto', opacity: 0.8, pointerEvents: 'none', zIndex: 0 }} />

                <h2 className={styles.title} style={{ marginTop: '30px' }}>{editItem ? '商品を編集' : '商品を追加'}</h2>
                <form action={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="name">商品名</label>
                        <input
                            type="text" id="name" name="name" required placeholder="例: マヨネーズ"
                            defaultValue={editItem?.name || ''}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="category">カテゴリ</label>
                        <input
                            type="text" id="category" name="category" list="categories" placeholder="例: 調味料"
                            defaultValue={editItem?.category || ''}
                        />
                        <datalist id="categories">
                            <option value="調味料" />
                            <option value="消耗品" />
                            <option value="食品" />
                        </datalist>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="quantity">現在庫数</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number" id="quantity" name="quantity" min="0"
                                defaultValue={editItem?.quantity || '1'}
                                style={{ flex: 1 }}
                            />
                            <select
                                name="unit"
                                id="unit"
                                defaultValue={editItem?.unit || '個'}
                                style={{ flex: 0.5, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="個">個</option>
                                <option value="パック">パック</option>
                                <option value="ケース">ケース</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="last_purchase_price">前回購入金額 (円)</label>
                        <input
                            type="number" id="last_purchase_price" name="last_purchase_price" min="0" placeholder="不明"
                            defaultValue={editItem?.last_purchase_price || ''}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="threshold">通知閾値</label>
                        <input
                            type="number" id="threshold" name="threshold" min="0"
                            defaultValue={editItem?.threshold || '1'}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={`${styles.btn} ${styles.btnCancel}`}>キャンセル</button>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>{editItem ? '保存' : '追加'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
