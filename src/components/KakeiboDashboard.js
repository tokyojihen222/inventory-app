'use client';

import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import styles from './KakeiboDashboard.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function KakeiboDashboard({ data, currentMonth, currentYear }) {
    const router = useRouter();
    const routerMonth = currentMonth;
    const routerYear = currentYear;

    // Data preparation
    const categoryData = Object.entries(data.categorySummary).map(([name, value]) => ({ name, value }));
    const storeData = Object.entries(data.storeSummary)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 stores

    const handleMonthChange = (offset) => {
        let newMonth = routerMonth + offset;
        let newYear = routerYear;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        router.push(`/kakeibo?year=${newYear}&month=${newMonth}`);
    };

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <Link href="/" className={styles.backLink}>← 在庫一覧に戻る</Link>
                <h1 className={styles.title}>家計簿ダッシュボード</h1>
            </div>

            <div className={styles.monthSelector}>
                <button onClick={() => handleMonthChange(-1)} className={styles.monthBtn}>◀</button>
                <h2 className={styles.currentMonth}>
                    {routerYear}年 {routerMonth}月
                </h2>
                <button onClick={() => handleMonthChange(1)} className={styles.monthBtn}>▶</button>
            </div>

            <div className={styles.summaryCard}>
                <h3>今月の支出合計</h3>
                <div className={styles.totalAmount}>
                    ¥{data.total.toLocaleString()}
                </div>
            </div>

            <div className={styles.chartsGrid}>
                {/* Category Chart */}
                <div className={styles.chartCard}>
                    <h3>カテゴリ別支出</h3>
                    <div style={{ height: 300 }}>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.noData}>データがありません</div>
                        )}
                    </div>
                </div>

                {/* Store Chart */}
                <div className={styles.chartCard}>
                    <h3>よく行くお店 (Top 5)</h3>
                    <div style={{ height: 300 }}>
                        {storeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={storeData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={100} />
                                    <RechartsTooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                                    <Bar dataKey="value" fill="#82ca9d" name="支出額" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.noData}>データがありません</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.historySection}>
                <h3>購入履歴 ({data.purchases.length}件)</h3>
                <div className={styles.historyList}>
                    {data.purchases.map(purchase => (
                        <div key={purchase.id} className={styles.historyItem}>
                            <div className={styles.historyDate}>
                                {new Date(purchase.purchase_date).toLocaleDateString()}
                            </div>
                            <div className={styles.historyStore}>
                                {purchase.store_name}
                            </div>
                            <div className={styles.historyAmount}>
                                ¥{purchase.total_amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
